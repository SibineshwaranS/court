const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const caseController = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent overwrite
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (restrict to PDFs, Word Docs, and basic images)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word documents, or image files (.jpg, .png) are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Case routes
router.get('/', protect, caseController.getCases);
router.get('/:id', protect, caseController.getCaseById);
router.post('/', protect, authorize('Administrator', 'Court Clerk'), caseController.createCase);
router.put('/:id', protect, authorize('Administrator', 'Court Clerk', 'Judge'), caseController.updateCase);
router.delete('/:id', protect, authorize('Administrator'), caseController.deleteCase);

// Prediction and Document uploads
router.post('/:id/predict', protect, caseController.triggerAIPrediction);
router.post('/:id/upload', protect, authorize('Administrator', 'Court Clerk', 'Judge'), upload.single('file'), caseController.uploadDocument);

module.exports = router;
