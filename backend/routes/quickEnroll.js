const express = require('express');
const validator = require('validator');
const { callGas } = require('../utils/gasClient');

const router = express.Router();

/* =========================================================
   POST /api/quick-enroll
   Captures a lightweight enrollment interest from the Courses
   page "Enroll Now" button — just name, father's name, mobile,
   and email. This is intentionally separate from full
   /api/register (which needs a password + full details and
   creates the actual student record + enrollment number).
   Saved to its own "Quick Enrollments" sheet so admissions staff
   can follow up and convert interested leads into full students.
   ========================================================= */
router.post('/quick-enroll', async (req, res) => {
  try {
    const { fullName, fatherName, mobile, email, course } = req.body || {};

    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ message: "Enter the student's full name." });
    }
    if (!fatherName || fatherName.trim().length < 3) {
      return res.status(400).json({ message: "Enter father's full name." });
    }
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!course) {
      return res.status(400).json({ message: 'Course is required.' });
    }

    await callGas('createQuickEnrollment', {
      fullName: validator.escape(fullName.trim()),
      fatherName: validator.escape(fatherName.trim()),
      mobile: mobile.trim(),
      email: email.toLowerCase().trim(),
      course,
      submittedAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: 'Enrollment interest submitted successfully.' });
  } catch (err) {
    console.error('Quick enroll error:', err.message);
    return res.status(500).json({ message: 'Could not submit right now. Please try again later.' });
  }
});

module.exports = router;
