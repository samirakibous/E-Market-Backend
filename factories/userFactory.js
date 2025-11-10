import User from '../models/User.js';
import { faker } from '@faker-js/faker';

/**
 * Creates one or more users in the database.
 * @param {number} count - Number of users to create (default 1)
 * @param {Object} overrides - Optional overrides applied to all users
 * @returns {Promise<User[]>} - Array of created user(s)
 */
export const userFactory = async (count = 1, overrides = {}) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    const user = await User.create({
      fullname: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: '123456',
      role: 'user',
      avatar: null,
      ...overrides,
    });
    users.push(user);
  }

  return users;
};
