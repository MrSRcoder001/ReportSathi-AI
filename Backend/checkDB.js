require('dotenv').config();
const mongoose = require('mongoose');
const HealthMetric = require('./models/HealthMetric');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const count = await HealthMetric.countDocuments({ status: 'UNINTERPRETABLE' });
  console.log('UNINTERPRETABLE count:', count);
  const metrics = await HealthMetric.find({ status: 'UNINTERPRETABLE' });
  console.log(metrics);
  process.exit(0);
});
