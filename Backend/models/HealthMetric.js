const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'PatientProfile',
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Report',
  },
  parameter: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  normalRange: {
    type: String,
  },
  status: {
    type: String,
    default: 'UNKNOWN'
  },
  reportDate: {
    type: Date,
    required: true,
  }
}, {
  timestamps: true,
});

// Indexes for fast trends and report query resolution
healthMetricSchema.index({ patientProfileId: 1, parameter: 1, reportDate: -1 });
healthMetricSchema.index({ reportId: 1 });

const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);
module.exports = HealthMetric;
