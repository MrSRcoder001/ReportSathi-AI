const express = require('express');
const router = express.Router();
const { getSystemMetrics } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// Middleware to assert admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

router.get('/metrics', protect, adminOnly, getSystemMetrics);

module.exports = router;
