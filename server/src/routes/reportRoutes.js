const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/daily', protect, reportController.getDailyReport);
router.get('/monthly', protect, reportController.getMonthlyReport);
router.get('/judge-performance', protect, reportController.getJudgePerformanceReport);
router.get('/court-performance', protect, reportController.getCourtPerformance);
router.get('/delay-analysis', protect, reportController.getDelayAnalysis);

module.exports = router;
