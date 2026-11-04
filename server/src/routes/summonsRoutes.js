const express = require('express');
const router = express.Router();
const witnessController = require('../controllers/witnessController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, witnessController.getSummons);
router.get('/:id/preview-email', witnessController.previewSummonsEmail);
router.post('/', protect, authorize('Administrator', 'Court Clerk', 'Judge'), witnessController.issueSummons);
router.post('/test-email', protect, authorize('Administrator', 'Court Clerk', 'Judge'), witnessController.sendTestEmail);
router.put('/:id/status', protect, authorize('Administrator', 'Court Clerk', 'Judge'), witnessController.updateSummonsStatus);

module.exports = router;

