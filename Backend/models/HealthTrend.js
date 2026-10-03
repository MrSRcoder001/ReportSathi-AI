const mongoose = require('mongoose');

const healthTrendSchema = new mongoose.Schema({
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'PatientProfile',
  },
  trendData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
});

// Index to fetch trends per patient profile quickly
healthTrendSchema.index({ patientProfileId: 1 });

const HealthTrend = mongoose.model('HealthTrend', healthTrendSchema);
module.exports = HealthTrend;
