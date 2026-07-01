const express = require('express');
const router = express.Router();
const { askReportQuestion } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/:id/chat', protect, askReportQuestion);

module.exports = router;
