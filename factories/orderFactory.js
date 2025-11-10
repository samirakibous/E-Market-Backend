import Order from '../models/Order.js';
import User from '../models/User.js';
import { faker } from '@faker-js/faker';

/**
 * Creates one or more random orders in the database.
 * @param {number} count - Number of orders to create (default 1)
 * @param {Object} overrides - Optional overrides for specific fields
 * @returns {Promise<Order[]>} - Array of created orders
 */
export const orderFactory = async (count = 1, overrides = {}) => {
  const orders = [];

  // Fetch users
  const users = await User.find({}, '_id');
  if (!users.length) throw new Error('No users found — seed users first!');

  for (let i = 0; i < count; i++) {
    // Pick random user
    const user = faker.helpers.arrayElement(users);

    // Generate random items (simulate products)
    const items = Array.from(
      { length: faker.number.int({ min: 1, max: 3 }) },
      () => {
        const price = faker.number.float({
          min: 10,
          max: 200,
          precision: 0.01,
        });
        const quantity = faker.number.int({ min: 1, max: 3 });
        return {
          productId: faker.database.mongodbObjectId(),
          quantity,
          price,
        };
      }
    );

    // Compute totals
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = faker.number.float({ min: 0, max: 0.3, precision: 0.01 }); // up to 30% discount
    const finalAmount = Number((totalAmount * (1 - discount)).toFixed(2));

    // Create order
    const order = await Order.create({
      userId: user._id,
      items,
      totalAmount,
      finalAmount,
      status: faker.helpers.arrayElement(['pending', 'shipped', 'delivered']),
      appliedCoupons: [],
      ...overrides,
    });

    orders.push(order);
  }

  return orders;
};
