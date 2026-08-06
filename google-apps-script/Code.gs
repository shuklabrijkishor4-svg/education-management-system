/**
 * AISECT Institute — Google Sheets "database" backend.
 *
 * Deploy this file as a Google Apps Script Web App (see README.md for
 * step-by-step instructions). The Node/Express backend is the only
 * client that should call this — it sends a shared secret with every
 * request so random visitors can't read or edit the sheet directly.
 *
 * SHEETS USED (created automatically on first run if missing):
 *   - "Students": one row per registered student
 *   - "Messages": one row per contact-form submission
 *
 * Students sheet columns (in order):
 *   EnrollmentNumber | RegistrationDate | FullName | FatherName | MotherName |
 *   DOB | Gender | Mobile | Email | Address | City | State | PinCode |
 *   Course | Qualification | PasswordHash | ProfilePhotoURL
 */

// 1) Open Script Properties (Project Settings > Script Properties) and add:
//      SHARED_SECRET = <same long random string as GAS_SHARED_SECRET in backend/.env>
const SHARED_SECRET = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');

const STUDENTS_SHEET_NAME = 'Students';
const MESSAGES_SHEET_NAME = 'Messages';
const QUICK_ENROLL_SHEET_NAME = 'Quick Enrollments';

const QUICK_ENROLL_COLUMNS = ['fullName', 'fatherName', 'mobile', 'email', 'course', 'submittedAt'];

const STUDENT_COLUMNS = [
  'enrollmentNumber', 'registrationDate', 'fullName', 'fatherName', 'motherName',
  'dob', 'gender', 'mobile', 'email', 'address', 'city', 'state', 'pincode',
  'course', 'qualification', 'passwordHash', 'profilePhoto',
];

const MESSAGE_COLUMNS = ['name', 'email', 'subject', 'message', 'receivedAt'];

/* =========================================================
   ENTRY POINT
   ========================================================= */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: 'Invalid JSON body.' });
  }

  if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
    return jsonResponse({ success: false, message: 'Unauthorized.' });
  }

  const action = body.action;
  const payload = body.payload || {};

  try {
    switch (action) {
      case 'createStudent':
        return jsonResponse({ success: true, data: createStudent(payload) });
      case 'findByIdentifier':
        return jsonResponse({ success: true, data: findByIdentifier(payload.identifier) });
      case 'updateStudent':
        return jsonResponse({ success: true, data: updateStudent(payload.enrollmentNumber, payload.updates) });
      case 'deleteStudent':
        return jsonResponse({ success: true, data: deleteStudent(payload.enrollmentNumber) });
      case 'checkDuplicate':
        return jsonResponse({ success: true, data: checkDuplicate(payload) });
      case 'checkEnrollmentExists':
        return jsonResponse({ success: true, data: checkEnrollmentExists(payload.enrollmentNumber) });
      case 'createMessage':
        return jsonResponse({ success: true, data: createMessage(payload) });
      case 'createQuickEnrollment':
        return jsonResponse({ success: true, data: createQuickEnrollment(payload) });
      default:
        return jsonResponse({ success: false, message: `Unknown action: ${action}` });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

// Optional: allow a simple GET health check when visiting the Web App URL directly.
function doGet(e) {
  return ContentService.createTextOutput('AISECT Institute Apps Script API is running.');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   SHEET HELPERS
   ========================================================= */
function getStudentsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STUDENTS_SHEET_NAME);
    sheet.appendRow([
      'Enrollment Number', 'Registration Date', 'Full Name', 'Father Name', 'Mother Name',
      'DOB', 'Gender', 'Mobile', 'Email', 'Address', 'City', 'State', 'PIN Code',
      'Course', 'Qualification', 'Password Hash', 'Profile Photo URL',
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getMessagesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MESSAGES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MESSAGES_SHEET_NAME);
    sheet.appendRow(['Name', 'Email', 'Subject', 'Message', 'Received At']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getQuickEnrollSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(QUICK_ENROLL_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(QUICK_ENROLL_SHEET_NAME);
    sheet.appendRow(["Student's Name", "Father's Name", 'Mobile', 'Email', 'Course', 'Submitted At']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowToStudentObject(row) {
  const obj = {};
  STUDENT_COLUMNS.forEach((key, i) => { obj[key] = row[i]; });
  return obj;
}

function studentObjectToRow(obj) {
  return STUDENT_COLUMNS.map((key) => (obj[key] !== undefined ? obj[key] : ''));
}

function getAllStudentRows() {
  const sheet = getStudentsSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, STUDENT_COLUMNS.length).getValues();
}

function findRowIndexByEnrollment(enrollmentNumber) {
  const rows = getAllStudentRows();
  for (let i = 0; i < rows.length; i += 1) {
    if (String(rows[i][0]).toUpperCase() === String(enrollmentNumber).toUpperCase()) {
      return { index: i + 2, row: rows[i] }; // +2: header row + 1-based index
    }
  }
  return null;
}

/* =========================================================
   CRUD OPERATIONS
   ========================================================= */
function createStudent(payload) {
  const sheet = getStudentsSheet();
  sheet.appendRow(studentObjectToRow(payload));
  return rowToStudentObject(studentObjectToRow(payload));
}

function findByIdentifier(identifier) {
  if (!identifier) return null;
  const id = String(identifier).trim().toLowerCase();
  const rows = getAllStudentRows();
  for (const row of rows) {
    const obj = rowToStudentObject(row);
    if (String(obj.enrollmentNumber).toLowerCase() === id || String(obj.email).toLowerCase() === id) {
      return obj;
    }
  }
  return null;
}

function updateStudent(enrollmentNumber, updates) {
  const found = findRowIndexByEnrollment(enrollmentNumber);
  if (!found) throw new Error('Student not found.');

  const current = rowToStudentObject(found.row);
  const merged = Object.assign({}, current, updates);
  const sheet = getStudentsSheet();
  sheet.getRange(found.index, 1, 1, STUDENT_COLUMNS.length).setValues([studentObjectToRow(merged)]);
  return merged;
}

function deleteStudent(enrollmentNumber) {
  const found = findRowIndexByEnrollment(enrollmentNumber);
  if (!found) throw new Error('Student not found.');
  getStudentsSheet().deleteRow(found.index);
  return { deleted: true };
}

function checkDuplicate(payload) {
  const { email, mobile, excludeEnrollmentNumber } = payload;
  const rows = getAllStudentRows();
  for (const row of rows) {
    const obj = rowToStudentObject(row);
    if (excludeEnrollmentNumber && String(obj.enrollmentNumber).toUpperCase() === String(excludeEnrollmentNumber).toUpperCase()) {
      continue; // skip the current user's own row when editing their profile
    }
    if (email && String(obj.email).toLowerCase() === String(email).toLowerCase()) {
      return { exists: true, field: 'email' };
    }
    if (mobile && String(obj.mobile) === String(mobile)) {
      return { exists: true, field: 'mobile' };
    }
  }
  return { exists: false };
}

function checkEnrollmentExists(enrollmentNumber) {
  return !!findRowIndexByEnrollment(enrollmentNumber);
}

function createMessage(payload) {
  const sheet = getMessagesSheet();
  sheet.appendRow(MESSAGE_COLUMNS.map((key) => payload[key] || ''));
  return { received: true };
}

function createQuickEnrollment(payload) {
  const sheet = getQuickEnrollSheet();
  sheet.appendRow(QUICK_ENROLL_COLUMNS.map((key) => payload[key] || ''));
  return { received: true };
}
