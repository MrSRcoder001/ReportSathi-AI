require('dotenv').config();
const mongoose = require('mongoose');
const HealthMetric = require('./models/HealthMetric');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const testMetric = new HealthMetric({
      patientProfileId: new mongoose.Types.ObjectId(),
      reportId: new mongoose.Types.ObjectId(),
      parameter: 'Test',
      value: '123',
      status: 'UNINTERPRETABLE',
      reportDate: new Date()
    });
    
    await testMetric.validate();
    console.log('Validation SUCCESS! The schema correctly allows UNINTERPRETABLE.');
  } catch (err) {
    console.error('Validation FAILED:', err.message);
  }
  process.exit(0);
});
