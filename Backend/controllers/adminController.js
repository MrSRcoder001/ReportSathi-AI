const Report = require('../models/Report');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const getSystemMetrics = async (req, res) => {
  try {
    // 1. Total User & Report Counts
    const userCount = await User.countDocuments();
    const reportCount = await Report.countDocuments();

    // 2. Report Status Breakdown
    const statusBreakdown = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. OCR Quality breakdown
    const ocrQualityBreakdown = await Report.aggregate([
      { $group: { _id: '$confidenceMetrics.ocrQuality', count: { $sum: 1 } } }
    ]);

    // 4. Average Health Score and Confidence
    const averages = await Report.aggregate([
      {
        $group: {
          _id: null,
          avgHealthScore: { $avg: '$healthScore' },
          avgConfidence: { $avg: '$confidenceMetrics.analysisConfidence' }
        }
      }
    ]);

    // 5. Flagged OCR / Parsing Failures (Low quality or Invalid reports)
    const flaggedReports = await Report.find({
      $or: [
        { 'confidenceMetrics.ocrQuality': 'Low' },
        { 'confidenceMetrics.documentDetection': 'Invalid' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email');

    // 6. Recent Audit Logs
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('userId', 'name email');

    res.json({
      summary: {
        users: userCount,
        reports: reportCount,
        averageHealthScore: averages[0]?.avgHealthScore ? Math.round(averages[0].avgHealthScore) : null,
        averageConfidence: averages[0]?.avgConfidence ? Math.round(averages[0].avgConfidence) : null,
      },
      statusDistribution: statusBreakdown,
      ocrQualityDistribution: ocrQualityBreakdown,
      flaggedFailures: flaggedReports,
      auditLogs: recentLogs,
      apiUsage: {
        totalCalls: reportCount * 4, // Estimate of LLM agent invokations
        costSaved: (reportCount * 0.02).toFixed(2), // Estimate savings of local Ollama vs paid OpenAI API
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemMetrics
};
