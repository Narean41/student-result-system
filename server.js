const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'student_portal_secret_key_999',
  resave: false,
  saveUninitialized: false
}));

app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// Student Login (Reg No + DOB)
app.post('/auth/student', (req, res) => {
  const { reg_no, dob } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE UPPER(reg_no) = UPPER(?) AND dob = ?').get(reg_no.trim(), dob.trim());
  if (student) {
    req.session.user = { role: 'student', data: student };
    return res.redirect('/student/dashboard');
  }
  res.render('index', { error: 'Invalid Register Number or DOB!' });
});

// Staff Login
app.post('/auth/staff', (req, res) => {
  const { username, password } = req.body;
  const staff = db.prepare('SELECT * FROM staff WHERE username = ? AND password = ?').get(username.trim(), password.trim());
  if (staff) {
    req.session.user = { role: 'staff', data: staff };
    return res.redirect('/staff/dashboard');
  }
  res.render('index', { error: 'Invalid Staff Username or Password!' });
});

// Student View Results
app.get('/student/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') return res.redirect('/');
  const student = req.session.user.data;
  const marks = db.prepare('SELECT * FROM marks WHERE UPPER(reg_no) = UPPER(?)').all(student.reg_no);
  res.render('student-dashboard', { student, marks });
});

// Staff Dashboard
app.get('/staff/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const students = db.prepare('SELECT * FROM students').all();
  res.render('staff-dashboard', { staff: req.session.user.data, students });
});

// Staff: Add Student
app.post('/staff/add-student', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no, name, dob, department } = req.body;
  try {
    db.prepare('INSERT INTO students (reg_no, name, dob, department) VALUES (?, ?, ?, ?)').run(reg_no.trim().toUpperCase(), name.trim(), dob, department.trim());
  } catch (err) {
    console.log(err.message);
  }
  res.redirect('/staff/dashboard');
});

// Staff: Add Mark
app.post('/staff/add-mark', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff') return res.redirect('/');
  const { reg_no, subject_code, subject_name, internal_marks, external_marks } = req.body;
  db.prepare('INSERT INTO marks (reg_no, subject_code, subject_name, internal_marks, external_marks) VALUES (?, ?, ?, ?, ?)')
    .run(reg_no.toUpperCase(), subject_code.toUpperCase(), subject_name, parseInt(internal_marks), parseInt(external_marks));
  res.redirect('/staff/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});