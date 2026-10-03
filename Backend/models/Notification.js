const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile',
  },
  type: {
    type: String,
    enum: ['RETEST', 'MEDICATION', 'PRESCRIPTION_EXPIRY', 'CRITICAL_ALERT', 'GENERAL'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  metadata: {
    reportId: mongoose.Schema.Types.ObjectId,
    medicationName: String,
    biomarker: String,
  }
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, isRead: 1, scheduledDate: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
