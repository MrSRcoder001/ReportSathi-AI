const express = require('express');
const router = express.Router();
const { compareReports } = require('../controllers/comparisonController');
const { protect } = require('../middleware/auth');

router.get('/:report1/:report2', protect, compareReports);

module.exports = router;
