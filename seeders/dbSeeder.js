import mongoose from 'mongoose';
import { userFactory } from '../factories/userFactory.js';
import dotenv from 'dotenv';
import { categoryFactory } from '../factories/categoryFactory.js';
import { cartFactory } from '../factories/cartFactory.js';
import { orderFactory } from '../factories/orderFactory.js';
import { couponFactory } from '../factories/couponFactory.js';
import { reviewFactory } from '../factories/reviewFactory.js';
import coupon from '../models/Coupon.js';
import User from '../models/User.js';
import productFactory from '../factories/productFactory.js';

//dotenv.config();
const env = process.env.NODE_ENV || 'development'; // Default to development
dotenv.config({ path: `./.env.${env}` });

const seedDB = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.DB_URI);

    // Clear DB
    await mongoose.connection.dropDatabase();
    console.log('Database cleared.');

    // Creat an admin
    await userFactory(1, {
      fullname: 'Admin User',
      email: 'admin@test.com',
      password: 'password',
      role: 'admin',
    });

    // Creat a seller
    await userFactory(1, {
      fullname: 'seller User',
      email: 'seller@test.com',
      password: 'password',
      role: 'seller',
    });

    // Creat a user
    await userFactory(1, {
      fullname: ' User',
      email: 'user@test.com',
      password: 'password',
      role: 'user',
    });
    await userFactory(5); // seed users
    await categoryFactory(6); // seed categories

    // Get users to create carts for them
    const users = await User.find().limit(3);
    for (const user of users) {
      await cartFactory(1, { userId: user._id });
    }

    await orderFactory(3); // seed orders
    await couponFactory(5); // seed coupons
    await reviewFactory(10); // seed reviews

    await mongoose.connection.close();
    console.log('Database seeding completed.');
  } catch (err) {
    console.error('Seeding error:', err);
    await mongoose.connection.close();
  }
};

// Run the seeder
seedDB();
