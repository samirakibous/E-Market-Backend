import Category from '../models/Category.js';
import { faker } from '@faker-js/faker';

/**
 * Creates one or more unique categories in the database.
 * @param {number} count - Number of categories to create (default 1)
 * @param {Object} overrides - Optional overrides applied to all categories
 * @returns {Promise<Category[]>} - Array of created category documents
 */
export const categoryFactory = async (count = 1, overrides = {}) => {
  // Generate unique category names
  const uniqueNames = faker.helpers.uniqueArray(
    faker.commerce.department,
    count
  );

  // Create all categories
  const categories = await Promise.all(
    uniqueNames.map(async (name) => {
      return Category.create({
        name: overrides.name || name,
        ...overrides,
      });
    })
  );

  return categories;
};
