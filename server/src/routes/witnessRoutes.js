const express = require('express');
const router = express.Router();
const witnessController = require('../controllers/witnessController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Witnesses endpoints
router.get('/', protect, witnessController.getWitnesses);
router.get('/:id/availability', protect, witnessController.getWitnessAvailability);

module.exports = router;

