import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error(
        'Hint: Check internet/DNS, VPN, and that MONGODB_URI in backend/.env is your real Atlas connection string (not the .env.example placeholder).'
      );
    }
    if (!process.env.MONGODB_URI) {
      console.error('Hint: MONGODB_URI is missing — copy backend/.env.example to backend/.env and set your Atlas URI.');
    }
    process.exit(1);
  }
};

export default connectDB;
