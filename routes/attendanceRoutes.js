const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Mark attendance for a class (teacher)
router.post('/mark', async (req, res) => {
  try {
    const { classId, date, records } = req.body; // records: [{studentId, status, reason}]
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    // Remove existing attendance for each student for this class/date
    for (const r of records) {
      await Attendance.deleteMany({ classId, studentId: r.studentId, date: new Date(date) });
    }
    // Insert new records
    const newRecords = records.map(r => ({
      studentId: r.studentId,
      classId,
      date: new Date(date),
      status: r.status,
      reason: r.reason || ''
    }));
    await Attendance.insertMany(newRecords);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
});

// Get attendance for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ error: 'Missing studentId.' });
    }
    const records = await Attendance.find({ studentId }).populate('classId');
    res.json(records);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

module.exports = router; 