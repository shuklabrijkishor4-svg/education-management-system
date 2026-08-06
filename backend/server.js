require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const contactRoutes = require('./routes/contact');
const quickEnrollRoutes = require('./routes/quickEnroll');

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
if (isProd) app.set('trust proxy', 1);

/* ---------- Security & parsing middleware ---------- */
app.use(helmet({ contentSecurityPolicy: false })); // CSP left to the static host; avoids breaking CDN assets
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: '3mb' })); // headroom for base64 profile photos

/* ---------- Rate limiting on sensitive endpoints (brute-force protection) ---------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);

/* ---------- Sessions (secure, httpOnly, CSRF-resistant via SameSite) ---------- */
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd, // requires HTTPS in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day by default; extended on "remember me"
  },
}));

/* ---------- Static files ----------
   Serves uploaded profile photos and (optionally) the whole
   frontend, so the entire site can run from one process. */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..'))); // serves index.html, css/, js/, etc.

/* ---------- API routes ---------- */
app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', contactRoutes);
app.use('/api', quickEnrollRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

/* ---------- 404 + error handling ---------- */
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Ascend Institute backend running on http://localhost:${PORT}`);
  if (!process.env.GAS_WEB_APP_URL) {
    console.warn('WARNING: GAS_WEB_APP_URL is not set — register/login/profile calls will fail until it is configured in backend/.env');
  }
});
