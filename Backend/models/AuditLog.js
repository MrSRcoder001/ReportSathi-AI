const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g. 'UPLOAD_REPORT', 'VIEW_REPORT', 'DELETE_REPORT', 'SHARE_REPORT', 'CONSENT_GRANTED', 'CONSENT_REVOKED'
  },
  resourceType: {
    type: String,
    required: true, // e.g. 'Report', 'PatientProfile', 'User'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  }
}, {
  timestamps: true,
});

auditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
