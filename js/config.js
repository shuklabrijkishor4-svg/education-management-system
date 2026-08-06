/**
 * Global front-end configuration.
 * All pages talk to the Node/Express backend at API_BASE — the
 * backend is the only thing that talks to Google Apps Script/Sheets.
 * Change API_BASE if you deploy the backend somewhere other than
 * the same origin as the static site (e.g. a separate Render/Railway URL).
 */
window.APP_CONFIG = {
  API_BASE: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:4000/api'
    : '/api',
  COURSES: [
    { id: 'basic-computer', name: 'Basic Computer Course', duration: '1 Month', instructor: 'Ansh Katiyar', icon: 'fa-solid fa-desktop', desc: 'Computer fundamentals, keyboard, file handling, and internet basics for absolute beginners.' },
    { id: 'computer-cert', name: 'Certificate in Using Computer', duration: '1 Month', instructor: 'Ansh Katiyar', icon: 'fa-solid fa-certificate', desc: 'A certified short course covering everyday computer operation and essential digital skills.' },
    { id: 'msoffice', name: 'MS-Office', duration: '2 Months', instructor: 'Priya Malhotra', icon: 'fa-solid fa-file-lines', desc: 'Word, Excel, and PowerPoint — practical document, spreadsheet, and presentation skills.' },
    { id: 'ccc', name: 'CCC (Course on Computer Concepts)', duration: '3 Months', instructor: 'Priya Malhotra', icon: 'fa-solid fa-computer', desc: 'Government-recognised computer literacy course covering concepts, internet, and office tools.' },
    { id: 'c', name: 'C Language', duration: '2 Months', instructor: 'Vikram Nair', icon: 'fa-solid fa-terminal', desc: 'The foundation course — memory, pointers, and logic building for every future language.' },
    { id: 'cpp', name: 'C++', duration: '3 Months', instructor: 'Vikram Nair', icon: 'fa-solid fa-plus', desc: 'Move from C into object-oriented design, STL, and competitive-programming techniques.' },
    { id: 'dca', name: 'Diploma in Computer Applications (DCA)', duration: '6 Months - 1 Year', instructor: 'Ansh Katiyar', icon: 'fa-solid fa-graduation-cap', desc: 'A comprehensive diploma covering office tools, programming basics, and internet applications.' },
    { id: 'java', name: 'Java', duration: '6 Months', instructor: 'Sana Iyer', icon: 'fa-brands fa-java', desc: 'Object-oriented programming, collections, and backend fundamentals with Java.' },
    { id: 'mysql', name: 'MySQL (Database Management)', duration: '6 Months', instructor: 'Sana Iyer', icon: 'fa-solid fa-database', desc: 'Database design, SQL queries, joins, and real-world data management with MySQL.' },
  ],
};
