const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');

// POST /api/quizzes (teacher creates quiz)
router.post('/', async (req, res) => {
  try {
    const { batchId, course, question, options, correctAnswer } = req.body;
    if (!batchId || !course || !question || !options || options.length !== 4 || correctAnswer === undefined) {
      return res.status(400).json({ error: 'All fields are required and options must be 4.' });
    }
    const quiz = new Quiz({ batchId, course, question, options, correctAnswer });
    await quiz.save();
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz.' });
  }
});

// GET /api/quizzes?batchId=...&course=...
router.get('/', async (req, res) => {
  try {
    const { batchId, course } = req.query;
    if (!batchId || !course) {
      return res.status(400).json({ error: 'batchId and course are required.' });
    }
    // Get the latest quiz for this batch and course
    const quiz = await Quiz.findOne({ batchId, course }).sort({ createdAt: -1 });
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz.' });
  }
});

module.exports = router; 