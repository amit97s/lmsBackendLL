const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher assignment is required']
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
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
studentSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to populate teacher details
studentSchema.methods.getTeacherDetails = async function() {
  return await this.populate('teacher', 'name course number');
};

// Static method to find students by teacher
studentSchema.statics.findByTeacher = async function(teacherId) {
  return await this.find({ teacher: teacherId }).populate('teacher', 'name course');
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 