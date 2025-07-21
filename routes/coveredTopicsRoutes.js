const express = require('express');
const router = express.Router();
const CoveredTopicStatus = require('../models/CoveredTopicStatus');

// GET /api/covered-topics?batchId=...&course=...
router.get('/', async (req, res) => {
  try {
    const { batchId, course } = req.query;
    if (!batchId || !course) {
      return res.status(400).json({ error: 'batchId and course are required' });
    }
    const doc = await CoveredTopicStatus.findOne({ batchId, course });
    res.json({ marked: doc ? doc.marked : {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch covered topics' });
  }
});

// POST /api/covered-topics
// { batchId, course, marked }
router.post('/', async (req, res) => {
  try {
    const { batchId, course, marked } = req.body;
    if (!batchId || !course || !marked) {
      return res.status(400).json({ error: 'batchId, course, and marked are required' });
    }
    const doc = await CoveredTopicStatus.findOneAndUpdate(
      { batchId, course },
      { marked },
      { upsert: true, new: true }
    );
    res.json({ success: true, marked: doc.marked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update covered topics' });
  }
});

module.exports = router; 