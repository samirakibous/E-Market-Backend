import Review from '../models/Review.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { faker } from '@faker-js/faker';

export const reviewFactory = async (count = 1, overrides = {}) => {
  const reviews = [];

  // Get existing users and products
  const users = await User.find({ role: 'user' }).limit(10);
  const products = await Product.find().limit(10);

  if (users.length === 0 || products.length === 0) {
    throw new Error('Need existing users and products to create reviews');
  }

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users);
    const product = faker.helpers.arrayElement(products);

    // Check if review already exists for this user-product combination
    const existingReview = await Review.findOne({
      user: user._id,
      product: product._id,
    });
    if (existingReview) continue;

    const review = await Review.create({
      user: user._id,
      product: product._id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentences({ min: 1, max: 3 }),
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      ...overrides,
    });
    reviews.push(review);
  }

  return reviews;
};
