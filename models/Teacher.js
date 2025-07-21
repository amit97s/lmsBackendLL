const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true
  },

  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  plainPassword: {
    type: String,
    required: false
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, {
  timestamps: true
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // plainPassword is already set from controller
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add student to teacher's list
teacherSchema.methods.addStudent = async function(studentId) {
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
    return await this.save();
  }
  return this;
};

// Method to remove student from teacher's list
teacherSchema.methods.removeStudent = async function(studentId) {
  this.students = this.students.filter(id => id.toString() !== studentId.toString());
  return await this.save();
};

// Method to populate students details
teacherSchema.methods.getStudentsDetails = async function() {
  return await this.populate('students', 'name course number');
};

// Static method to find teacher with all students
teacherSchema.statics.findWithStudents = async function(teacherId) {
  return await this.findById(teacherId).populate('students', 'name course number');
};

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher; 