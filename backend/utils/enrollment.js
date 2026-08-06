const { callGas } = require('./gasClient');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomEnrollmentNumber() {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

/**
 * Generates a 6-character uppercase alphanumeric enrollment number and
 * verifies against Google Sheets that it isn't already in use, retrying
 * a handful of times in the (extremely unlikely) event of a collision.
 */
async function generateUniqueEnrollmentNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomEnrollmentNumber();
    const exists = await callGas('checkEnrollmentExists', { enrollmentNumber: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate a unique enrollment number. Please try again.');
}

module.exports = { generateUniqueEnrollmentNumber, randomEnrollmentNumber };
