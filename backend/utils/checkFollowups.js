import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FollowUp from '../models/FollowUp.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';

dotenv.config();

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
  const venkat = await User.findOne({ email: 'venkat@crm.com' });
  const vicky = await User.findOne({ email: 'vicky@crm.com' });
  console.log('venkat', venkat?._id?.toString());
  console.log('vicky', vicky?._id?.toString());

  const followupsVenkat = await FollowUp.find({ assignedTo: venkat?._id }).populate('lead', 'name assignedTo');
  console.log('venkat followups count', followupsVenkat.length);
  for (const fu of followupsVenkat) {
    console.log('FU', fu._id.toString(), fu.lead?.name, 'leadAssignedTo', fu.lead?.assignedTo?.toString(), 'me', venkat?._id?.toString());
  }

  const followupsVicky = await FollowUp.find({ assignedTo: vicky?._id }).populate('lead', 'name assignedTo');
  console.log('vicky followups count', followupsVicky.length);
  for (const fu of followupsVicky) {
    console.log('FU', fu._id.toString(), fu.lead?.name, 'leadAssignedTo', fu.lead?.assignedTo?.toString(), 'me', vicky?._id?.toString());
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
