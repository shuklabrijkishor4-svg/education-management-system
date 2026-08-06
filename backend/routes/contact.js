const express = require('express');
const validator = require('validator');

const router = express.Router();

/* =========================================================
   POST /api/contact
   Stores enquiries via the same Google Apps Script backend
   (a "Messages" sheet) so no separate database is needed.
   Swap the callGas call for a real mailer if you'd rather
   receive enquiries by email.
   ========================================================= */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Enter your full name.' });
    if (!email || !validator.isEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!subject || subject.trim().length < 3) return res.status(400).json({ message: 'Add a short subject.' });
    if (!message || message.trim().length < 10) return res.status(400).json({ message: 'Message should be at least 10 characters.' });

    const { callGas } = require('../utils/gasClient');
    await callGas('createMessage', {
      name: validator.escape(name.trim()),
      email: email.toLowerCase().trim(),
      subject: validator.escape(subject.trim()),
      message: validator.escape(message.trim()),
      receivedAt: new Date().toISOString(),
    });

    return res.json({ message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    return res.status(500).json({ message: 'Could not send your message right now. Please try again later.' });
  }
});

module.exports = router;
