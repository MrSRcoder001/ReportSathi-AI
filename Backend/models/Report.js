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
      default: 'UNKNOWN'
    },
    insight: {
      type: String,
      default: ''
    },
    confidence: {
      type: Number,
      default: 100
    },
    referenceRangeSource: {
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
    default: 'English'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'review_pending', 'completed', 'failed'],
    default: 'pending',
  },
  confirmed: {
    type: Boolean,
    default: true
  },
  criticalAlert: {
    type: Boolean,
    default: false
  },
  criticalAlertDetails: {
    type: String,
    default: ''
  },
  medications: {
    type: [String],
    default: []
  },
  symptoms: {
    type: [String],
    default: []
  },
  shareToken: {
    type: String,
    default: null
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

// Production indexes for high-speed queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ patientProfileId: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
