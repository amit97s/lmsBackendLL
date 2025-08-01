const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@learnzlab.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email template for welcome onboarding
const getWelcomeEmailTemplate = (userName, userType, course) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ThinkGrow Media!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Welcome to ThinkGrow Media! We're excited to have you on board as a ${userType}.
        </p>
        
        ${course ? `<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>Course:</strong> ${course}
        </p>` : ''}
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c5aa0; margin-top: 0;">What's Next?</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>Complete your profile setup</li>
            <li>Review your course materials</li>
            <li>Connect with your ${userType === 'student' ? 'teacher' : 'students'}</li>
            <li>Start your learning journey!</li>
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or need assistance, feel free to reach out to our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #999; font-size: 14px;">
            Best regards,<br>
            The ThinkGrow Media Team
          </p>
        </div>
      </div>
    </div>
  `;
};

// Function to send email
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: 'info@learnzlab.com',
      to: to,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

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

// Test route to check if routing is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working!' });
});

// Simple test POST route
router.post('/test-post', (req, res) => {
  res.json({ success: true, message: 'POST route is working!', body: req.body });
});

// Debug route to check all available routes
router.get('/debug', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes debug info',
    routes: [
      'GET /api/auth/test',
      'POST /api/auth/test-post', 
      'POST /api/auth/notify',
      'POST /api/auth/login',
      'GET /api/auth/check',
      'GET /api/auth/debug-users'
    ]
  });
});

// POST /api/auth/notify
router.post('/notify', async (req, res) => {
  console.log('Notify route hit with body:', req.body);
  
  try {
    const { type, id } = req.body;
    
    if (!type || !id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and ID are required' 
      });
    }

    let user;
    if (type === 'student') {
      user = await Student.findById(id);
    } else if (type === 'teacher') {
      user = await Teacher.findById(id);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid type. Must be "student" or "teacher"' 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: `${type} not found` 
      });
    }

    // Send welcome onboarding email
    const emailSubject = `Welcome to ThinkGrow Media - ${user.name}!`;
    const emailContent = getWelcomeEmailTemplate(user.name, type, user.course);
    
    const emailResult = await sendEmail(user.email, emailSubject, emailContent);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: `Welcome email sent to ${user.name} (${user.email})`,
        notification: {
          type,
          userId: id,
          userName: user.name,
          userEmail: user.email,
          messageId: emailResult.messageId,
          timestamp: new Date()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error
      });
    }
    
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

module.exports = router;