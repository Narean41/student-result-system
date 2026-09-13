const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'student_secret_key_123',
  resave: false,
  saveUninitialized: false
}));

// Home / Login Page
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Student Login Route
app.post('/student/login', (req, res) => {
  const { reg_no, dob } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE reg_no = ? AND dob = ?').get(reg_no, dob);

  if (student) {
    req.session.user = { ...student, role: 'student' };
    return res.redirect('/student/result');
  }
  res.render('index', { error: 'Invalid Register Number or DOB!' });
});

// Student Result Page
app.get('/student/result', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') return res.redirect('/');
  
  const marks = db.prepare('SELECT * FROM marks WHERE reg_no = ?').all(req.session.user.reg_no);
  res.render('result', { student: req.session.user, marks });
});

// Staff Login Route
app.post('/staff/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'staff1' && password === 'staff123') {
    req.session.user = { username, role: 'staff' };
    return res.redirect('/staff/dashboard');
  }
  res.render('index', { error: 'Invalid Staff Credentials!' });
});

// Staff Dashboard View
app.get('/staff/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  
  const students = db.prepare('SELECT * FROM students ORDER BY reg_no ASC').all();
  const marks = db.prepare('SELECT * FROM marks').all();
  res.render('staff-dashboard', { students, marks });
});

// Add New Student
app.post('/staff/add-student', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no, name, dob, department } = req.body;
  
  try {
    db.prepare('INSERT INTO students (reg_no, name, dob, department) VALUES (?, ?, ?, ?)').run(reg_no, name, dob, department);
  } catch (err) {
    console.error("Error inserting student:", err.message);
  }
  res.redirect('/staff/dashboard');
});

// Add Subject & Marks
app.post('/staff/add-mark', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no, subject_code, subject_name, internal_marks, external_marks } = req.body;
  
  try {
    db.prepare('INSERT INTO marks (reg_no, subject_code, subject_name, internal_marks, external_marks) VALUES (?, ?, ?, ?, ?)').run(reg_no, subject_code, subject_name, internal_marks, external_marks);
  } catch (err) {
    console.error("Error inserting marks:", err.message);
  }
  res.redirect('/staff/dashboard');
});

// Update Student (Edit details)
app.post('/staff/update-student', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no, name, dob, department } = req.body;
  
  db.prepare('UPDATE students SET name = ?, dob = ?, department = ? WHERE reg_no = ?').run(name, dob, department, reg_no);
  res.redirect('/staff/dashboard');
});

// Delete Student
app.post('/staff/delete-student', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no } = req.body;
  
  db.prepare('DELETE FROM marks WHERE reg_no = ?').run(reg_no);
  db.prepare('DELETE FROM students WHERE reg_no = ?').run(reg_no);
  res.redirect('/staff/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});