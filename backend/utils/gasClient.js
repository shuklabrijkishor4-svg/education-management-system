/**
 * Thin client for the Google Apps Script Web App that acts as our
 * Google Sheets "database". Every call POSTs { action, payload, secret }
 * and expects back JSON: { success: boolean, data?: any, message?: string }
 */
require('dotenv').config();

const GAS_URL = process.env.GAS_WEB_APP_URL;
const SHARED_SECRET = process.env.GAS_SHARED_SECRET;

async function callGas(action, payload = {}) {
  if (!GAS_URL) {
    throw new Error('GAS_WEB_APP_URL is not configured. Deploy Code.gs and set it in backend/.env');
  }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, secret: SHARED_SECRET, payload }),
  });
  if (!res.ok) {
    throw new Error(`Google Apps Script request failed with status ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Google Apps Script returned an error');
  }
  return json.data;
}

module.exports = { callGas };
