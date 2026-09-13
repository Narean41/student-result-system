const Database = require('better-sqlite3');
const db = new Database('results.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    reg_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dob TEXT NOT NULL,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS staff (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_no TEXT,
    subject_code TEXT,
    subject_name TEXT,
    internal_marks INTEGER,
    external_marks INTEGER
  );
`);

// Demo accounts
const addStaff = db.prepare('INSERT OR IGNORE INTO staff (username, password, name) VALUES (?, ?, ?)');
addStaff.run('staff1', 'staff123', 'Prof. Ramesh');

const addStudent = db.prepare('INSERT OR IGNORE INTO students (reg_no, name, dob, department) VALUES (?, ?, ?, ?)');
addStudent.run('REG101', 'Narean', '2004-05-15', 'Computer Science & Engineering');

const addMark = db.prepare('INSERT OR IGNORE INTO marks (reg_no, subject_code, subject_name, internal_marks, external_marks) VALUES (?, ?, ?, ?, ?)');
addMark.run('REG101', 'CS301', 'Data Structures', 24, 68);
addMark.run('REG101', 'CS302', 'Operating Systems', 22, 65);
addMark.run('REG101', 'CS303', 'Database Management Systems', 25, 69);

module.exports = db;