const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { callGas } = require('../utils/gasClient');
const { generateUniqueEnrollmentNumber } = require('../utils/enrollment');
const { saveBase64Photo } = require('../utils/photoStorage');

const router = express.Router();

/** Strips the password hash and other internal fields before sending a
 *  student record to the browser. */
function toSafeUser(row) {
  if (!row) return null;
  const { passwordHash, ...safe } = row;
  return safe;
}

/* =========================================================
   POST /api/register
   ========================================================= */
router.post('/register', async (req, res) => {
  try {
    const b = req.body || {};
    const required = ['fullName', 'dob', 'fatherName', 'motherName', 'gender', 'mobile', 'email', 'address', 'city', 'state', 'pincode', 'course', 'qualification', 'password'];
    for (const key of required) {
      if (!b[key] || String(b[key]).trim() === '') {
        return res.status(400).json({ message: `${key} is required.`, field: key });
      }
    }
    if (!validator.isEmail(b.email)) return res.status(400).json({ message: 'Enter a valid email address.', field: 'email' });
    if (!/^[6-9]\d{9}$/.test(b.mobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.', field: 'mobile' });
    if (!/^\d{6}$/.test(b.pincode)) return res.status(400).json({ message: 'Enter a valid 6-digit PIN code.', field: 'pincode' });
    if (b.password.length < 8 || !/[A-Z]/.test(b.password) || !/[0-9]/.test(b.password)) {
      return res.status(400).json({ message: 'Password needs 8+ characters with an uppercase letter and a number.', field: 'password' });
    }

    // Server-side duplicate check against the sheet (client-side checks can be bypassed).
    const duplicate = await callGas('checkDuplicate', { email: b.email, mobile: b.mobile });
    if (duplicate && duplicate.exists) {
      return res.status(409).json({ message: `That ${duplicate.field} is already registered.`, field: duplicate.field });
    }

    const enrollmentNumber = await generateUniqueEnrollmentNumber();
    const passwordHash = await bcrypt.hash(b.password, 12);
    let profilePhotoUrl = null;
    if (b.profilePhoto) {
      profilePhotoUrl = saveBase64Photo(b.profilePhoto, enrollmentNumber);
    }

    const registrationDate = new Date().toISOString().slice(0, 10);
    const record = {
      enrollmentNumber,
      registrationDate,
      fullName: validator.escape(b.fullName.trim()),
      fatherName: validator.escape(b.fatherName.trim()),
      motherName: validator.escape(b.motherName.trim()),
      dob: b.dob,
      gender: b.gender,
      mobile: b.mobile,
      email: b.email.toLowerCase().trim(),
      address: validator.escape(b.address.trim()),
      city: validator.escape(b.city.trim()),
      state: validator.escape(b.state.trim()),
      pincode: b.pincode,
      course: b.course,
      qualification: b.qualification,
      passwordHash,
      profilePhoto: profilePhotoUrl || '',
    };

    await callGas('createStudent', record);

    req.session.enrollmentNumber = enrollmentNumber;
    return res.status(201).json({ enrollmentNumber, message: 'Registration successful.' });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ message: 'Something went wrong while registering. Please try again.' });
  }
});

/* =========================================================
   POST /api/login
   ========================================================= */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, remember } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Enter your enrollment number/email and password.' });
    }

    const row = await callGas('findByIdentifier', { identifier: identifier.trim() });
    if (!row) {
      return res.status(401).json({ message: 'No account found with that enrollment number or email.' });
    }

    const matches = await bcrypt.compare(password, row.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    req.session.enrollmentNumber = row.enrollmentNumber;
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    return res.json({ user: toSafeUser(row), message: 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Something went wrong while logging in. Please try again.' });
  }
});

/* =========================================================
   POST /api/logout
   ========================================================= */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

/* =========================================================
   GET /api/session — used by every page to know if a student
   is logged in, and by the dashboard/profile pages for data.
   ========================================================= */
router.get('/session', async (req, res) => {
  if (!req.session.enrollmentNumber) return res.json({ loggedIn: false });
  try {
    const row = await callGas('findByIdentifier', { identifier: req.session.enrollmentNumber });
    if (!row) {
      req.session.destroy(() => {});
      return res.json({ loggedIn: false });
    }
    return res.json({ loggedIn: true, user: toSafeUser(row) });
  } catch (err) {
    console.error('Session check error:', err.message);
    return res.json({ loggedIn: false });
  }
});

/* =========================================================
   POST /api/forgot-password
   NOTE: sending real emails requires an SMTP/email provider.
   This endpoint validates the request and always responds the
   same way (whether or not the email exists) to avoid leaking
   which emails are registered. Wire up a mail provider such as
   Nodemailer + SendGrid/SES in production.
   ========================================================= */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  // Intentionally does not reveal whether the account exists.
  return res.json({ message: 'If that email is registered, reset instructions have been sent.' });
});

module.exports = router;
