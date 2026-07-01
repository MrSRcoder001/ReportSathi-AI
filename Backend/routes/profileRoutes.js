const express = require('express');
const router = express.Router();
const { getProfiles, createProfile, getProfileById, updateProfile, deleteProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProfiles)
  .post(protect, createProfile);

router.route('/:id')
  .get(protect, getProfileById)
  .put(protect, updateProfile)
  .delete(protect, deleteProfile);

router.get('/:id/trends', protect, require('../controllers/profileController').getProfileTrends);
router.get('/:id/timeline', protect, require('../controllers/profileController').getProfileTimeline);

module.exports = router;
