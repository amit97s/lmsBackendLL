const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  course: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema); 