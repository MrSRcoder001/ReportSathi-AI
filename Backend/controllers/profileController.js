const PatientProfile = require('../models/PatientProfile');
const Report = require('../models/Report');
const HealthMetric = require('../models/HealthMetric');

// Get all profiles for the logged in user
const getProfiles = async (req, res) => {
  try {
    const profiles = await PatientProfile.find({ userId: req.user._id });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new profile
const createProfile = async (req, res) => {
  try {
    const { profileName, relation, age, gender, bloodGroup, conditions, allergies, medications, doctorNotes } = req.body;
    
    const profile = await PatientProfile.create({
      userId: req.user._id,
      profileName,
      relation,
      age,
      gender,
      bloodGroup,
      conditions: conditions || [],
      allergies: allergies || [],
      medications: medications || [],
      doctorNotes: doctorNotes || ''
    });
    
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single profile
const getProfileById = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a profile
const updateProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const updatedProfile = await PatientProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a profile
const deleteProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await profile.deleteOne();
    // Also delete associated reports and metrics? (Optional but recommended)
    await Report.deleteMany({ patientProfileId: profile._id });
    await HealthMetric.deleteMany({ patientProfileId: profile._id });

    res.json({ message: 'Profile removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile trends (fetch HealthMetrics grouped by parameter)
const getProfileTrends = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const metrics = await HealthMetric.find({ patientProfileId: req.params.id }).sort({ reportDate: 1 });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile timeline (reports and metrics sorted by date)
const getProfileTimeline = async (req, res) => {
  try {
    const profile = await PatientProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const reports = await Report.find({ patientProfileId: req.params.id }).sort({ createdAt: -1 }).select('reportName healthScore status createdAt aiSummary');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfiles,
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getProfileTrends,
  getProfileTimeline
};
