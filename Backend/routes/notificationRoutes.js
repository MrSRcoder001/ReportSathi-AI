const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationRead, createNotification, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.post('/', protect, createNotification);
router.put('/:id/read', protect, markNotificationRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
