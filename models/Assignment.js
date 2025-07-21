const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  filename: { type: String, required: true }, // stored filename
  originalname: { type: String, required: true }, // original filename
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  batchId: { type: String, required: true },
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 