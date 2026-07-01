const Report = require('../models/Report');
const { generateComparisonInsight } = require('../agents/comparisonAgent');

const compareReports = async (req, res) => {
  try {
    const { report1, report2 } = req.params;

    const r1 = await Report.findById(report1);
    const r2 = await Report.findById(report2);

    if (!r1 || !r2) {
      return res.status(404).json({ message: 'One or both reports not found' });
    }

    if (r1.patientProfileId.toString() !== r2.patientProfileId.toString()) {
      return res.status(400).json({ message: 'Cannot compare reports from different patient profiles.' });
    }

    if (r1.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Sort chronologically
    const [older, newer] = r1.createdAt < r2.createdAt ? [r1, r2] : [r2, r1];

    const olderParams = older.parameters || [];
    const newerParams = newer.parameters || [];

    const diffData = [];

    newerParams.forEach(newP => {
      const oldP = olderParams.find(p => p.parameter.toLowerCase() === newP.parameter.toLowerCase());
      if (oldP) {
        const oldVal = parseFloat(oldP.value);
        const newVal = parseFloat(newP.value);
        
        let percentChange = 0;
        if (!isNaN(oldVal) && !isNaN(newVal) && oldVal !== 0) {
          percentChange = ((newVal - oldVal) / oldVal) * 100;
        }

        let statusChange = null;
        if (oldP.status !== newP.status) {
          statusChange = `${oldP.status} → ${newP.status}`;
        }

        diffData.push({
          parameter: newP.parameter,
          previousValue: oldP.value,
          currentValue: newP.value,
          normalRange: newP.normalRange,
          percentageChange: percentChange.toFixed(1) + '%',
          statusChange: statusChange
        });
      }
    });

    const aiInsight = await generateComparisonInsight(diffData);

    res.json({
      olderReportDate: older.createdAt,
      newerReportDate: newer.createdAt,
      diffData,
      aiInsight
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { compareReports };
