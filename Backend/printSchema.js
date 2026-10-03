const HealthMetric = require('./models/HealthMetric');
console.log(HealthMetric.schema.path('status').enumValues);
