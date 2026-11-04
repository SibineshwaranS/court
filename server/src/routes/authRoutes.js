const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', protect, authController.getProfile);
router.get('/judges', protect, authController.getJudgesList);

module.exports = router;
