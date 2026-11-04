const express = require('express');
const router = express.Router();
const hearingController = require('../controllers/hearingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, hearingController.getHearings);
router.get('/recommendations', protect, hearingController.getHearingRecommendations);
router.post('/', protect, authorize('Administrator', 'Court Clerk', 'Judge'), hearingController.createHearing);
router.put('/:id', protect, authorize('Administrator', 'Court Clerk', 'Judge'), hearingController.updateHearing);
router.delete('/:id', protect, authorize('Administrator', 'Court Clerk', 'Judge'), hearingController.deleteHearing);

module.exports = router;
