import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cart from '../models/Cart.js';

//dotenv.config();
const env = process.env.NODE_ENV || 'development'; // Default to development
dotenv.config({ path: `./.env.${env}` });
const uri = process.env.DB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    // Ensure Cart indexes are created
    try {
      await Cart.init();
    } catch (err) {
      console.error('Error ensuring Cart indexes:', err);
    }
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // stop server if DB connection fails
  }
};

export default connectDB;
