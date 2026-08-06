This project's API layer lives in `../backend` (Express routes under
`backend/routes/`). This folder is kept for structural parity with the
requested layout; if you prefer routes physically under `api/`, move
`backend/routes/*.js` here and update `backend/server.js`'s `require()` paths.
