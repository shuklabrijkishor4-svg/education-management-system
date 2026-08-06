const express = require('express');
const validator = require('validator');
const { callGas } = require('../utils/gasClient');
const { saveBase64Photo } = require('../utils/photoStorage');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.enrollmentNumber) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }
  next();
}

/* =========================================================
   PUT /api/profile — student edits their own record.
   ========================================================= */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const updates = {};

    if (b.fullName !== undefined) {
      if (b.fullName.trim().length < 3) return res.status(400).json({ message: 'Enter a valid full name.' });
      updates.fullName = validator.escape(b.fullName.trim());
    }
    if (b.mobile !== undefined) {
      if (!/^[6-9]\d{9}$/.test(b.mobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
      updates.mobile = b.mobile;
    }
    if (b.email !== undefined) {
      if (!validator.isEmail(b.email)) return res.status(400).json({ message: 'Enter a valid email address.' });
      updates.email = b.email.toLowerCase().trim();
    }
    if (b.address !== undefined) updates.address = validator.escape(b.address.trim());
    if (b.city !== undefined) updates.city = validator.escape(b.city.trim());
    if (b.state !== undefined) updates.state = validator.escape(b.state.trim());
    if (b.course !== undefined) updates.course = b.course;
    if (b.profilePhoto) {
      updates.profilePhoto = saveBase64Photo(b.profilePhoto, req.session.enrollmentNumber);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No changes were submitted.' });
    }

    // Duplicate-check email/mobile against other students, if being changed.
    if (updates.email || updates.mobile) {
      const dup = await callGas('checkDuplicate', {
        email: updates.email,
        mobile: updates.mobile,
        excludeEnrollmentNumber: req.session.enrollmentNumber,
      });
      if (dup && dup.exists) {
        return res.status(409).json({ message: `That ${dup.field} is already used by another account.` });
      }
    }

    const updated = await callGas('updateStudent', {
      enrollmentNumber: req.session.enrollmentNumber,
      updates,
    });

    const { passwordHash, ...safeUser } = updated;
    return res.json({ message: 'Profile updated.', user: safeUser });
  } catch (err) {
    console.error('Profile update error:', err.message);
    return res.status(500).json({ message: 'Could not update profile. Please try again.' });
  }
});

/* =========================================================
   DELETE /api/profile — permanently removes the student record.
   ========================================================= */
router.delete('/profile', requireAuth, async (req, res) => {
  try {
    await callGas('deleteStudent', { enrollmentNumber: req.session.enrollmentNumber });
    req.session.destroy(() => {});
    res.clearCookie('connect.sid');
    return res.json({ message: 'Account deleted.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    return res.status(500).json({ message: 'Could not delete account. Please try again.' });
  }
});

module.exports = router;
