const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const biasController = require('../controllers/biasController');
const { protect } = require('../middleware/authMiddleware');

router.get('/priority-distribution', protect, analyticsController.getPriorityDistribution);
router.get('/judge-workload', protect, analyticsController.getJudgeWorkload);
router.get('/monthly-cases', protect, analyticsController.getMonthlyCases);
router.get('/pending-age', protect, analyticsController.getPendingCasesAgeDistribution);
router.get('/bias-audit', protect, biasController.getBiasAudit);

module.exports = router;
