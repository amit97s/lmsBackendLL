const ClassExtensionRequest = require('../models/ClassExtensionRequest');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

exports.createRequest = async (req, res) => {
  try {
    const { batchId, teacherId, reason, extraClasses } = req.body;
    const request = new ClassExtensionRequest({ batchId, teacherId, reason, extraClasses });
    await request.save();
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating request', error: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ClassExtensionRequest.find()
      .populate('batchId', 'course startDate endDate')
      .populate('teacherId', 'name email');
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await ClassExtensionRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving request', error: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await ClassExtensionRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting request', error: error.message });
  }
}; 