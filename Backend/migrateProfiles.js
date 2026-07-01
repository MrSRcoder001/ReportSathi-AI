require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const PatientProfile = require('./models/PatientProfile');
const Report = require('./models/Report');

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Migrating...`);

    for (const user of users) {
      // Create a "Self" profile for each user if they don't have one
      let selfProfile = await PatientProfile.findOne({ userId: user._id, relation: 'Self' });
      
      if (!selfProfile) {
        selfProfile = await PatientProfile.create({
          userId: user._id,
          profileName: user.name || 'My Profile',
          relation: 'Self',
          age: 30, // Default age
          gender: 'Male', // Default gender
          bloodGroup: 'Unknown'
        });
        console.log(`Created Self profile for user: ${user.email}`);
      }

      // Update all existing reports for this user to belong to their Self profile
      const updateRes = await Report.updateMany(
        { userId: user._id, patientProfileId: { $exists: false } },
        { $set: { patientProfileId: selfProfile._id } }
      );
      
      if (updateRes.modifiedCount > 0) {
        console.log(`Updated ${updateRes.modifiedCount} reports for user: ${user.email}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
