import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { faker } from '@faker-js/faker';

export const couponFactory = async (count = 1, overrides = {}) => {
  const coupons = [];

  // Get an admin user to be the creator
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      fullname: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });
  }

  for (let i = 0; i < count; i++) {
    const startDate = faker.date.future();
    const expirationDate = faker.date.future({ refDate: startDate });

    const coupon = await Coupon.create({
      code: faker.string
        .alphanumeric({ length: { min: 6, max: 12 } })
        .toUpperCase(),
      type: faker.helpers.arrayElement(['percentage', 'fixed']),
      value:
        faker.helpers.arrayElement(['percentage', 'fixed']) === 'percentage'
          ? faker.number.int({ min: 5, max: 50 })
          : faker.number.int({ min: 10, max: 100 }),
      minimumPurchase: faker.number.int({ min: 0, max: 200 }),
      startDate,
      expirationDate,
      maxUsage: faker.helpers.maybe(() =>
        faker.number.int({ min: 10, max: 1000 })
      ),
      maxUsagePerUser: faker.number.int({ min: 1, max: 5 }),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      createdBy: admin._id,
      ...overrides,
    });
    coupons.push(coupon);
  }

  return coupons;
};
