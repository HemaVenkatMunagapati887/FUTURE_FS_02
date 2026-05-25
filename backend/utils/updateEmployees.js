import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

dotenv.config();

const updateEmployeeNames = async () => {
  await connectDB();

  const updates = [
    {
      oldEmail: 'alice@crm.com',
      newEmail: 'venkat@crm.com',
      newName: 'Venkat',
    },
    {
      oldEmail: 'bob@crm.com',
      newEmail: 'vicky@crm.com',
      newName: 'Vicky',
    },
  ];

  for (const { oldEmail, newEmail, newName } of updates) {
    const user = await User.findOne({ email: oldEmail });
    if (!user) {
      console.warn(`User not found: ${oldEmail}`);
      continue;
    }

    let changed = false;
    if (user.name !== newName) {
      user.name = newName;
      changed = true;
    }
    if (user.email !== newEmail) {
      user.email = newEmail;
      changed = true;
    }

    if (changed) {
      await user.save();
      console.log(`Updated ${oldEmail} -> ${newName} / ${newEmail}`);
    } else {
      console.log(`Already up to date: ${oldEmail}`);
    }
  }

  const activityUpdates = [
    { oldName: 'Alice', newName: 'Venkat' },
    { oldName: 'Bob', newName: 'Vicky' },
  ];

  for (const { oldName, newName } of activityUpdates) {
    const activities = await Activity.find({ details: { $regex: new RegExp(oldName, 'g') } });
    for (const activity of activities) {
      activity.details = activity.details.replace(new RegExp(oldName, 'g'), newName);
      await activity.save();
    }
    if (activities.length > 0) {
      console.log(`Updated ${activities.length} activity details from ${oldName} to ${newName}`);
    }
  }

  console.log('Employee name update complete.');
  process.exit(0);
};

updateEmployeeNames().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
