const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc    Create a new student
// @route   POST /api/students
// @access  Public
const createStudent = async (req, res) => {
  try {
    const { name, number, email, course, assign, address, password, teacherId } = req.body;

    // Ensure teacherId is provided
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher assignment is required. Please select a teacher.'
      });
    }

    // Check if student with same number or email already exists
    const existingStudent = await Student.findOne({ $or: [{ number }, { email }] });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student with this phone number or email already exists' 
      });
    }

    // Verify teacher exists if teacherId is provided
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ 
          success: false, 
          message: 'Teacher not found' 
        });
      }
    }

    const student = new Student({
      name,
      number,
      email,
      course,
      assign,
      address,
      password,
      plainPassword: password,
      teacher: teacherId
    });

    const savedStudent = await student.save();

    // Add student to teacher's students array if teacherId is provided
    if (teacherId) {
      await Teacher.findByIdAndUpdate(
        teacherId,
        { $addToSet: { students: savedStudent._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        id: savedStudent._id,
        name: savedStudent.name,
        number: savedStudent.number,
        email: savedStudent.email,
        course: savedStudent.course,
        assign: savedStudent.assign,
        address: savedStudent.address,
        teacher: savedStudent.teacher,
        password: savedStudent.plainPassword
      }
    });

  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Public
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .populate('teacher', 'name course number');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Public
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('teacher', 'name course number');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Public
const updateStudent = async (req, res) => {
  try {
    const { name, number, course, assign, address, password, teacherId } = req.body;

    // Check if student exists
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if number is already taken by another student
    if (number && number !== student.number) {
      const existingStudent = await Student.findOne({ number, _id: { $ne: req.params.id } });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already taken by another student'
        });
      }
    }

    // Verify teacher exists if teacherId is provided
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }
    }

    const updateData = {
      name: name || student.name,
      number: number || student.number,
      course: course || student.course,
      address: address || student.address,
      teacher: teacherId || student.teacher
    };

    if (password) {
      updateData.password = password;
      updateData.plainPassword = password;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teacher', 'name course number');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Public
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from teacher's students array
    if (student.teacher) {
      await Teacher.findByIdAndUpdate(
        student.teacher,
        { $pull: { students: student._id } }
      );
    }

    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get students by teacher
// @route   GET /api/students/teacher/:teacherId
// @access  Public
const getStudentsByTeacher = async (req, res) => {
  try {
    const students = await Student.findByTeacher(req.params.teacherId);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Error fetching students by teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Student login
// @route   POST /api/students/login
// @access  Public
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find by email or number
    const student = await Student.findOne({email:email});
    console.log(student);

    if (!student) {

      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }
    if (student.plainPassword !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }
    res.status(200).json({
      success: true,
      role: 'student',
      data: {
        id: student._id,
        name: student.name,
        number: student.number,
        email: student.email,
        course: student.course,
        address: student.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByTeacher,
  loginStudent
}; 