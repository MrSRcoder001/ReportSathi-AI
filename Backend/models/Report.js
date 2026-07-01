const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'PatientProfile',
  },
  reportName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  patientDetails: {
    name: { type: String, default: '' },
    age: { type: String, default: '' },
    gender: { type: String, default: '' },
    laboratory: { type: String, default: '' },
    date: { type: String, default: '' }
  },
  confidenceMetrics: {
    documentDetection: { type: String, default: 'Pending' },
    ocrQuality: { type: String, default: 'Pending' },
    analysisConfidence: { type: Number, default: 0 },
    evidenceUsed: { type: [String], default: [] }
  },
  aiSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  parameters: [{
    parameter: String,
    value: String,
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'UNKNOWN', 'UNINTERPRETABLE'],
      default: 'UNKNOWN'
    },
    insight: {
      type: String,
      default: ''
    }
  }],
  healthScore: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'en'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  precautions: {
    type: [String],
    default: []
  },
  actionPlan: {
    type: [String],
    default: []
  },
  doctorQuestions: {
    type: [String],
    default: []
  },
  lifestyleGuidance: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
