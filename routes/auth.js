const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });

    // Hardcoded admin login
    if (email === 'admin@admin.com' && password === 'admin@123') {
      const payload = {
        id: 'admin',
        name: 'Admin',
        role: 'admin',
        email: 'admin@admin.com',
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: 'admin',
          name: 'Admin',
          email: 'admin@admin.com',
          role: 'admin',
        }
      });
    }

    // Try to find teacher first
    let user = await Teacher.findOne({ $or: [ { email }, { number: email } ] });
    console.log('Teacher found:', user ? 'Yes' : 'No');

    if (user) {
      console.log('Teacher password check:', user.plainPassword, '===', password);
      if (user.plainPassword === password) {
        const payload = {
          id: user._id,
          name: user.name,
          role: 'teacher',
          number: user.number,
          email: user.email,
          course: user.course,
          address: user.address
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        return res.status(200).json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            phone: user.number,
            email: user.email,
            role: 'teacher',
            course: user.course
          }
        });
      }
    }

    // Try to find student
    user = await Student.findOne({ $or: [ { email }, { number: email } ] });
    console.log('Student found:', user ? 'Yes' : 'No');

    if (user) {
      console.log('Student password check:', user.plainPassword, '===', password);
      if (user.plainPassword === password) {
        // Populate teacher for student
        let teacherName = '';
        if (user.teacher) {
          const teacher = await Teacher.findById(user.teacher);
          teacherName = teacher ? teacher.name : '';
        }
        const payload = {
          id: user._id,
          name: user.name,
          role: 'student',
          number: user.number,
          email: user.email,
          course: user.course,
          address: user.address,
          teacherName
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        return res.status(200).json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            phone: user.number,
            email: user.email,
            role: 'student',
            course: user.course,
            teacherName
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// DEBUG: List all users (teachers and students)
router.get('/debug-users', async (req, res) => {
  try {
    const teachers = await Teacher.find({}, 'name email number course address plainPassword');
    const students = await Student.find({}, 'name email number course address plainPassword');
    res.json({
      teachers: teachers.map(t => ({ ...t.toObject(), role: 'teacher' })),
      students: students.map(s => ({ ...s.toObject(), role: 'student' }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Create test users for development
router.post('/create-test-users', async (req, res) => {
  try {
    // Create a test teacher
    const testTeacher = new Teacher({
      name: 'Test Teacher',
      number: '1234567890',
      email: 'teacher@test.com',
      course: 'Data Science',
      address: 'Test Address',
      password: 'teacher123',
      plainPassword: 'teacher123'
    });
    await testTeacher.save();

    // Create a test student
    const testStudent = new Student({
      name: 'Test Student',
      number: '0987654321',
      email: 'student@test.com',
      course: 'Data Science',
      address: 'Test Address',
      password: 'student123',
      plainPassword: 'student123',
      teacher: testTeacher._id
    });
    await testStudent.save();

    res.json({
      success: true,
      message: 'Test users created successfully',
      teacher: {
        email: 'teacher@test.com',
        password: 'teacher123'
      },
      student: {
        email: 'student@test.com',
        password: 'student123'
      }
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ success: false, message: 'Error creating test users', error: error.message });
  }
});

// Add /api/auth/check endpoint
router.get('/check', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.json({ success: false, isAuthenticated: false });
    const token = authHeader.split(' ')[1];
    if (!token) return res.json({ success: false, isAuthenticated: false });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    let teacherName = '';
    if (decoded.role === 'student' && decoded.teacher) {
      const teacher = await Teacher.findById(decoded.teacher);
      teacherName = teacher ? teacher.name : '';
    }
    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: decoded.id,
        name: decoded.name,
        phone: decoded.number,
        email: decoded.email,
        role: decoded.role,
        course: decoded.course,
        teacherName
      }
    });
  } catch (err) {
    res.json({ success: false, isAuthenticated: false });
  }
});

module.exports = router;