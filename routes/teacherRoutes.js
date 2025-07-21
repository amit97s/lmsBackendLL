const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherWithStudents,
  assignStudentToTeacher,
  removeStudentFromTeacher,
  loginTeacher,
  createClass,
  getClassesForTeacher,
  uploadAssignment,
  getAssignments,
  uploadStudentProject,
  getStudentProjects
} = require('../controllers/teacherController');

// Assignment routes FIRST to avoid /:id collision
router.get('/assignments', getAssignments); // expects course, batchId, teacherId (optional)
router.post('/assignments', uploadAssignment); // expects course, batchId, teacherId, file

// Create a new teacher
router.post('/', createTeacher);

// Get all teachers
router.get('/', getAllTeachers);

// Get teacher by ID
router.get('/:id', getTeacherById);

// Update teacher
router.put('/:id', updateTeacher);

// Delete teacher
router.delete('/:id', deleteTeacher);

// Get teacher with all students
router.get('/:id/students', getTeacherWithStudents);

// Assign student to teacher
router.post('/:id/assign-student', assignStudentToTeacher);

// Remove student from teacher
router.delete('/:id/remove-student/:studentId', removeStudentFromTeacher);

// Add class routes
router.post('/:id/classes', createClass);
router.get('/:id/classes', getClassesForTeacher);

// Teacher login
router.post('/login', require('../controllers/teacherController').loginTeacher);

// Student project routes
router.post('/assignments/submit', uploadStudentProject);
router.get('/assignments/projects', getStudentProjects);
router.post('/assignments/score', require('../controllers/teacherController').scoreStudentProject);

module.exports = router; 