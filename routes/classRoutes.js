const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// GET /api/classes - get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'name email course')
      .populate('students', 'name email course');
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
  }
});

// GET /api/classes/:id - get a single class by ID
router.get('/:id', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('teacher', 'name email course')
      .populate('students', 'name email course');
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching class', error: error.message });
  }
});

// PUT /api/classes/:id - update a class by ID
router.put('/:id', async (req, res) => {
  try {
    const update = {
      course: req.body.course,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      startDate: req.body.startDate,
      students: req.body.studentIds,
      duration: req.body.duration,
      frequency: req.body.frequency,
      teacher: req.body.teacherId,
    };
    const updated = await Class.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('teacher', 'name email course')
      .populate('students', 'name email course');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating class', error: error.message });
  }
});

// DELETE /api/classes/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting class', error: error.message });
  }
});

module.exports = router; 