import mongoose from 'mongoose';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development'; // Default to development
dotenv.config({ path: `./.env.${env}` });

const resetDB = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error('Missing DB_URI in .env file');
    }

    await mongoose.connect(process.env.DB_URI);
    await mongoose.connection.dropDatabase();
    console.log('✅ Database reset successfully.');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error resetting database:', err.message);
    process.exit(1);
  }
};

resetDB();
