# Learners Academy — Education Management System

A full-stack education management website: a static HTML/CSS/JS frontend, a
Node.js + Express backend for authentication and business logic, and Google
Sheets (via a Google Apps Script Web App) as the student database.

```
Browser  ⇄  Express backend (Node)  ⇄  Google Apps Script Web App  ⇄  Google Sheet
```

The frontend never talks to Google directly — it only calls the Express API.
Express hashes passwords, manages secure sessions, validates every field, and
is the only thing that holds the Apps Script URL and shared secret.

---

## 1. Project Structure

```
education-management-system/
├── index.html                # Home
├── about.html                # About Us
├── courses.html               # Courses (search + filter)
├── contact.html                # Contact Us (form + map)
├── register.html               # Student registration
├── login.html                  # Login (+ forgot password modal)
├── dashboard.html              # Student dashboard (after login)
├── profile.html                 # View / update / delete profile
│
├── css/
│   └── style.css              # Full design system ("Chalkboard & Brass")
├── js/
│   ├── config.js              # API base URL + course catalog
│   ├── main.js                 # Nav, theme toggle, reveal animation, toasts
│   ├── auth.js                  # Register + login logic, validation
│   ├── dashboard.js            # Dashboard data + delete/logout
│   ├── profile.js                # Profile edit/delete
│   └── contact.js               # Contact form
├── images/, assets/            # Static media
│
├── backend/                     # Node + Express API
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js             # register, login, logout, session, forgot-password
│   │   ├── profile.js           # update, delete
│   │   └── contact.js           # contact form
│   ├── utils/
│   │   ├── gasClient.js        # calls the Apps Script Web App
│   │   ├── enrollment.js       # generates/verifies unique enrollment numbers
│   │   └── photoStorage.js     # saves base64 profile photos to /uploads
│   ├── uploads/                 # uploaded profile photos (served at /uploads)
│   ├── package.json
│   └── .env.example
│
├── google-apps-script/
│   └── Code.gs                  # CRUD engine deployed as a Google Sheets Web App
│
└── README.md
```

---

## 2. Google Sheets + Apps Script Setup

1. Create a new Google Sheet (any name, e.g. "Learners Academy — Student Records").
2. Open **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste in the contents of
   `google-apps-script/Code.gs` from this project.
4. Go to **Project Settings (gear icon) → Script Properties → Add script property**:
   - Key: `SHARED_SECRET`
   - Value: a long random string (generate one, e.g. with `openssl rand -hex 32`)
   - **Save this value** — you'll paste the same string into the backend's `.env` as `GAS_SHARED_SECRET`.
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (the shared secret is what actually protects it)
6. Click **Deploy**, authorize the requested permissions, and copy the **Web app URL**
   (ends in `/exec`).
7. The script auto-creates a `Students` sheet and a `Messages` sheet with headers
   the first time it runs — no manual sheet setup needed.

Whenever you edit `Code.gs`, use **Deploy → Manage deployments → Edit → New version**
so the live Web App URL picks up your changes.

---

## 3. Backend (Node/Express) Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
GAS_WEB_APP_URL=<the /exec URL from step 2.6>
GAS_SHARED_SECRET=<the same SHARED_SECRET value from step 2.4>
SESSION_SECRET=<another long random string>
FRONTEND_ORIGIN=http://localhost:5500
PORT=4000
NODE_ENV=development
```

Run it:

```bash
npm start
```

The backend also serves the static frontend directly from the project root, so
once it's running you can simply open **http://localhost:4000** and use the
whole site from one process. (If you prefer serving the frontend separately —
e.g. with VS Code's Live Server on port 5500 — that works too; `FRONTEND_ORIGIN`
just needs to match wherever the HTML is served from, for CORS/cookies to work.)

---

## 4. Running Locally (quick start)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # fill in GAS_WEB_APP_URL, GAS_SHARED_SECRET, SESSION_SECRET
npm start

# 2. Visit the site
open http://localhost:4000
```

Register a test account, confirm the enrollment number appears, then check
the Google Sheet — a new row should appear in the `Students` tab instantly.

---

## 5. Deploying Online

- **Backend**: deploy the `backend/` folder to any Node host (Render, Railway,
  Fly.io, an EC2/VPS with PM2, etc.). Set the same environment variables from
  `.env` in your host's dashboard. Make sure `NODE_ENV=production` so cookies
  are marked `Secure` (requires HTTPS).
- **Frontend**: if you split it from the backend, host the static files
  (`index.html`, `css/`, `js/`, etc.) on any static host (Netlify, Vercel,
  GitHub Pages, S3). Update `js/config.js`'s `API_BASE` to point at your
  deployed backend's `/api` URL, and set `FRONTEND_ORIGIN` on the backend to
  that static site's URL.
- **Google Apps Script**: no separate deployment step — it already lives on
  Google's infrastructure once deployed as a Web App (step 2).

---

## 6. Security Notes

- Passwords are hashed with **bcrypt** (12 rounds) before ever reaching Google
  Sheets — the sheet never stores plaintext passwords.
- Sessions use `express-session` with `httpOnly`, `sameSite: lax` cookies
  (and `secure` in production), so a logged-in student's identity can't be
  read or forged from client-side JavaScript.
- All form input is validated both client-side (fast feedback) and
  server-side (the only validation that can't be bypassed).
- The Apps Script Web App requires a shared secret on every request, so it
  can't be called by anyone who doesn't also have your backend's `.env`.
- Login and registration are rate-limited (30 requests / 15 minutes / IP) to
  slow down brute-force attempts.
- User-supplied text (name, address, etc.) is escaped before storage to guard
  against script injection when displayed elsewhere.

**Not included, and worth adding if you productionize further:** email
verification, a real transactional-email provider for "Forgot Password"
(the endpoint is stubbed and documented in `backend/routes/auth.js`), CAPTCHA
on the public forms, and audit logging.

---

## 7. Extending

- Swap `js/config.js`'s hard-coded `COURSES` array for a `Courses` sheet + a
  `listCourses` Apps Script action if you want to manage courses from Sheets
  instead of code.
- The "Download Receipt" and "Print Profile" buttons currently use the
  browser's print dialog (`window.print()` / a pop-up print window) — swap in
  a PDF library (e.g. `pdf-lib` or `puppeteer` on the backend) for a
  polished, downloadable PDF if needed.
- MySQL was listed as an optional backup store — the `backend/utils/gasClient.js`
  module is the single choke point to swap out if you migrate off Google
  Sheets later; every route calls Sheets only through that file.
