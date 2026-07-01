const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { uploadReport, getReports, getReportById } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20000000 }, // 20MB
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a PDF or Image file'));
    }
    cb(undefined, true);
  }
});

router.post('/upload', protect, upload.single('report'), uploadReport);
router.get('/', protect, getReports);
router.get('/:id', protect, getReportById);

module.exports = router;
