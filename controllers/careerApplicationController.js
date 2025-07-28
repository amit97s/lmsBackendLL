const CareerApplication = require('../models/CareerApplication');
const path = require('path');

// POST /api/career-applications
exports.submitApplication = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const resume = req.file ? req.file.path.replace(/\\/g, '/') : '';
    if (!name || !phone || !email || !address || !resume) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const application = new CareerApplication({
      name,
      phone,
      email,
      address,
      resume
    });
    await application.save();
    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/career-applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await CareerApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 