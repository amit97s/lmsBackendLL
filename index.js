const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db/db');
const path = require('path');

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const coveredTopicsRoutes = require('./routes/coveredTopicsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const classExtensionRequestRoutes = require('./routes/classExtensionRequestRoutes');
const careerApplicationRoutes = require('./routes/careerApplicationRoutes');

// Load .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/covered-topics', coveredTopicsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/class-extension-requests', classExtensionRequestRoutes);
app.use('/api/career-applications', careerApplicationRoutes);

// Serve assignment uploads
app.use('/uploads/assignments', express.static(path.join(__dirname, 'uploads/assignments')));
// Serve student project uploads
app.use('/uploads/student_projects', express.static(path.join(__dirname, 'uploads/student_projects')));
// Serve resume uploads
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes')));

// Test route
app.get('/', (req, res) => {
  res.send('🔥 Server & MongoDB are connected!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
