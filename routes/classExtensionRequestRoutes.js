const express = require('express');
const router = express.Router();
const classExtensionRequestController = require('../controllers/classExtensionRequestController');

router.post('/', classExtensionRequestController.createRequest);
router.get('/', classExtensionRequestController.getAllRequests);
router.put('/:id/approve', classExtensionRequestController.approveRequest);
router.put('/:id/reject', classExtensionRequestController.rejectRequest);

module.exports = router; 