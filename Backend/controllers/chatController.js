const Report = require('../models/Report');
const { askQuestion } = require('../agents/chatAgent');

const askReportQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Call Chat Agent
    const answer = await askQuestion(question, report);

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { askReportQuestion };
