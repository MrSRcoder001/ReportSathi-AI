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
    enum: ['LOW', 'NORMAL', 'HIGH', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  reportDate: {
    type: Date,
    required: true,
  }
}, {
  timestamps: true,
});

const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);
module.exports = HealthMetric;
