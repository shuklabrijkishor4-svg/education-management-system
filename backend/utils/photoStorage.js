const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Accepts a data URL like "data:image/png;base64,AAAA..." and writes it to
 * /backend/uploads, returning a relative URL the frontend/server can serve.
 * Returns null if input is falsy (photo upload is optional).
 */
function saveBase64Photo(dataUrl, enrollmentNumber) {
  if (!dataUrl) return null;
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Profile photo must be a valid image file.');

  const mime = match[1];
  const ext = ALLOWED_MIME[mime];
  if (!ext) throw new Error('Only PNG, JPG, and WEBP images are allowed.');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_BYTES) throw new Error('Profile photo must be under 2MB.');

  const filename = `${enrollmentNumber}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

module.exports = { saveBase64Photo };
