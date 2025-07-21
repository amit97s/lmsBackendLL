const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByTeacher
} = require('../controllers/studentController');
const Assignment = require('../models/Assignment');

// Create a new student
router.post('/', createStudent);

// Get all students
router.get('/', getAllStudents);

// Get assignments for a student by course or batch
router.get('/assignments', async (req, res) => {
  try {
    const { course, batchId } = req.query;
    let filter = {};
    if (course) filter.course = course;
    if (batchId) filter.batchId = batchId;
    const assignments = await Assignment.find(filter).sort({ uploadDate: -1 });
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching assignments' });
  }
});

// Get student by ID
router.get('/:id', getStudentById);

// Update student
router.put('/:id', updateStudent);

// Delete student
router.delete('/:id', deleteStudent);

// Get students by teacher
router.get('/teacher/:teacherId', getStudentsByTeacher);

// Student login
router.post('/login', require('../controllers/studentController').loginStudent);

module.exports = router; 