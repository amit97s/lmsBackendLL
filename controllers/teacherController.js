const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const StudentProject = require('../models/StudentProject');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for assignments
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/assignments'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const assignmentUpload = multer({
  storage: assignmentStorage,
  fileFilter: (req, file, cb) => {
    // Accept only images and pdf
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// POST /api/assignments (teacher upload)
const uploadAssignment = [
  assignmentUpload.single('file'),
  async (req, res) => {
    try {
      const { course, teacherId, batchId } = req.body;
      if (!req.file || !course || !teacherId || !batchId) {
        return res.status(400).json({ success: false, message: 'File, course, teacherId, and batchId are required.' });
      }
      const assignment = new Assignment({
        course,
        teacher: teacherId,
        batchId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      await assignment.save();
      res.status(201).json({ success: true, message: 'Assignment uploaded', data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error uploading assignment', error: error.message });
    }
  }
];

// GET /api/assignments?course=...&teacherId=...&batchId=...
const getAssignments = async (req, res) => {
  try {
    const { course, teacherId, batchId } = req.query;
    if (!course || !batchId) {
      return res.status(400).json({ success: false, message: 'course and batchId are required.' });
    }
    const query = { course, batchId };
    if (teacherId) query.teacher = teacherId;
    const assignments = await Assignment.find(query).sort({ uploadDate: -1 });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
};

// Multer setup for student projects (zip only)
const studentProjectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/student_projects');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const studentProjectUpload = multer({
  storage: studentProjectStorage,
  fileFilter: (req, file, cb) => {
    // Accept images, pdf, and zip files
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.endsWith('.zip')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and ZIP files are allowed!'));
    }
  }
});

// POST /api/teachers/assignments/submit (student upload)
const uploadStudentProject = [
  studentProjectUpload.single('file'),
  async (req, res) => {
    try {
      const { course, teacherId, studentId } = req.body;
      if (!req.file || !course || !teacherId || !studentId) {
        return res.status(400).json({ success: false, message: 'File, course, teacherId, and studentId are required.' });
      }
      const project = new StudentProject({
        course,
        teacher: teacherId,
        student: studentId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      await project.save();
      res.status(201).json({ success: true, message: 'Project uploaded', data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error uploading project', error: error.message });
    }
  }
];

// GET /api/teachers/assignments/projects?course=...&teacherId=...
const getStudentProjects = async (req, res) => {
  try {
    const { course, teacherId } = req.query;
    if (!course || !teacherId) {
      return res.status(400).json({ success: false, message: 'course and teacherId are required.' });
    }
    const projects = await StudentProject.find({ course, teacher: teacherId }).populate('student', 'name email').sort({ uploadDate: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
  }
};

// POST /api/teachers/assignments/score (teacher gives score to student project)
const scoreStudentProject = async (req, res) => {
  try {
    const { projectId, score } = req.body;
    if (!projectId || typeof score !== 'number') {
      return res.status(400).json({ success: false, message: 'projectId and score are required.' });
    }
    const project = await StudentProject.findByIdAndUpdate(
      projectId,
      { score },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.status(200).json({ success: true, message: 'Score updated', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating score', error: error.message });
  }
};

// @desc    Create a new teacher
// @route   POST /api/teachers
// @access  Public
const createTeacher = async (req, res) => {
  try {
    const { name, number, email, course, address, password } = req.body;
    // Check if teacher with same number or email already exists
    const existingTeacher = await Teacher.findOne({ $or: [{ number }, { email }] });
    if (existingTeacher) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher with this phone number or email already exists' 
      });
    }
    const teacher = new Teacher({
      name,
      number,
      email,
      course,
      address,
      password,
      plainPassword: password
    });
    const savedTeacher = await teacher.save();
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: savedTeacher._id,
        name: savedTeacher.name,
        number: savedTeacher.number,
        email: savedTeacher.email,
        course: savedTeacher.course,
        address: savedTeacher.address,
        password: savedTeacher.plainPassword
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({})
      .populate('students', 'name course number');

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Public
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('students', 'name course number');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Public
const updateTeacher = async (req, res) => {
  try {
    const { name, number, course, address, password } = req.body;

    // Check if teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if number is already taken by another teacher
    if (number && number !== teacher.number) {
      const existingTeacher = await Teacher.findOne({ number, _id: { $ne: req.params.id } });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already taken by another teacher'
        });
      }
    }

    const updateData = {
      name: name || teacher.name,
      number: number || teacher.number,
      course: course || teacher.course,
      address: address || teacher.address
    };

    if (password) {
      updateData.password = password;
      updateData.plainPassword = password;
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('students', 'name course number');

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });

  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Public
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Remove teacher reference from all students
    await Student.updateMany(
      { teacher: teacher._id },
      { $unset: { teacher: "" } }
    );

    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get teacher with all students
// @route   GET /api/teachers/:id/students
// @access  Public
const getTeacherWithStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findWithStudents(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });

  } catch (error) {
    console.error('Error fetching teacher with students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Assign student to teacher
// @route   POST /api/teachers/:id/assign-student
// @access  Public
const assignStudentToTeacher = async (req, res) => {
  try {
    const { studentId } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Add student to teacher's students array
    await teacher.addStudent(studentId);

    // Update student's teacher reference
    await Student.findByIdAndUpdate(studentId, { teacher: teacher._id });

    const updatedTeacher = await Teacher.findWithStudents(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student assigned to teacher successfully',
      data: updatedTeacher
    });

  } catch (error) {
    console.error('Error assigning student to teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Remove student from teacher
// @route   DELETE /api/teachers/:id/remove-student/:studentId
// @access  Public
const removeStudentFromTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from teacher's students array
    await teacher.removeStudent(req.params.studentId);

    // Remove teacher reference from student
    await Student.findByIdAndUpdate(req.params.studentId, { $unset: { teacher: "" } });

    const updatedTeacher = await Teacher.findWithStudents(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student removed from teacher successfully',
      data: updatedTeacher
    });

  } catch (error) {
    console.error('Error removing student from teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Teacher login
// @route   POST /api/teachers/login
// @access  Public
const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find by email or number
    const teacher = await Teacher.findOne(email);
    if (!teacher) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }
    if (teacher.plainPassword !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }
    res.status(200).json({
      success: true,
      role: 'teacher',
      data: {
        id: teacher._id,
        name: teacher.name,
        number: teacher.number,
        email: teacher.email,
        course: teacher.course,
        address: teacher.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// @desc    Create a new class (schedule)
// @route   POST /api/teachers/:id/classes
// @access  Admin
const createClass = async (req, res) => {
  try {
    const { course, startTime, endTime, startDate, studentIds, duration, frequency } = req.body;
    const teacherId = req.params.id;
    if (!course || !startTime || !endTime || !teacherId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Create a single recurring class template
    const classDoc = new Class({
      course,
      startTime,
      endTime,
      teacher: teacherId,
      startDate,
      students: Array.isArray(studentIds) ? studentIds : [],
      duration: duration || 3,
      frequency: frequency || 'weekday',
      isRecurring: true
    });
    
    const savedClass = await classDoc.save();

    res.status(201).json({ 
      success: true, 
      message: 'Class schedule created successfully', 
      data: savedClass 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating class', error: error.message });
  }
};

// @desc    Get all classes for a teacher
// @route   GET /api/teachers/:id/classes
// @access  Teacher
const getClassesForTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const classes = await Class.find({ teacher: teacherId })
      .populate('teacher', 'name course')
      .populate('students', 'name course')
      .sort({ startTime: 1 });
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
  }
};

module.exports = {
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
  getStudentProjects,
  scoreStudentProject
}; 