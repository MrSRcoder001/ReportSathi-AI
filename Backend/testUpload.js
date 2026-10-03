require('dotenv').config();
const mongoose = require('mongoose');
const { processReport } = require('./controllers/reportController');
const Report = require('./models/Report');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  // Find a failed report
  const report = await Report.findOne({ status: 'failed' }).sort({ createdAt: -1 });
  if (!report) {
    console.log('No failed reports found');
    process.exit(0);
  }
  console.log(`Retrying report ${report._id}`);
  
  // We need a file mock. The original file path is in report.fileUrl
  const mockFile = { path: report.fileUrl, originalname: report.reportName };
  
  await processReport(report._id, mockFile, report.language);
  console.log('Finished processing');
  
  const fs = require('fs');
  if (fs.existsSync('error.log')) {
    console.log('--- ERROR LOG ---');
    console.log(fs.readFileSync('error.log', 'utf8'));
  }
  
  process.exit(0);
});
