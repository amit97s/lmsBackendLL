const mongoose = require('mongoose');

const studentProjectSchema = new mongoose.Schema({
  course: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  score: { type: Number, required: false },
});

const StudentProject = mongoose.model('StudentProject', studentProjectSchema);

module.exports = StudentProject; 