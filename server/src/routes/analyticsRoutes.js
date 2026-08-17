const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/priority-distribution', protect, analyticsController.getPriorityDistribution);
router.get('/judge-workload', protect, analyticsController.getJudgeWorkload);
router.get('/monthly-cases', protect, analyticsController.getMonthlyCases);
router.get('/pending-age', protect, analyticsController.getPendingCasesAgeDistribution);

module.exports = router;
