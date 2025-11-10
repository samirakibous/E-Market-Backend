import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

export const productFactory = async (count = 1, overrides = {}) => {
  const products = [];

  const users = await User.find({}, '_id role').lean();
  if (!users.length) throw new Error('No users found — seed users first!');

  const sellers = users.filter((u) => u.role === 'seller');
  if (!sellers.length)
    throw new Error('No sellers found — seed sellers first!');

  const categories = await Category.find({}, '_id').lean();
  if (!categories.length)
    throw new Error('No categories found — seed categories first!');

  for (let i = 0; i < count; i++) {
    let sellerId = overrides.seller_id || overrides.sellerId;
    if (!sellerId) {
      if (sellers.length) sellerId = faker.helpers.arrayElement(sellers)._id;
      else sellerId = faker.helpers.arrayElement(users)._id; // fallback to any user
    }

    let categoryIds = [];
    if (Array.isArray(overrides.categories) && overrides.categories.length) {
      categoryIds = overrides.categories;
    } else if (
      Array.isArray(overrides.categoryIds) &&
      overrides.categoryIds.length
    ) {
      categoryIds = overrides.categoryIds;
    } else if (categories.length) {
      const howMany = faker.number.int({
        min: 0,
        max: Math.min(2, categories.length),
      });
      for (let j = 0; j < howMany; j++) {
        categoryIds.push(faker.helpers.arrayElement(categories)._id);
      }
    }

    const price =
      overrides.price ??
      Number(
        faker.number.float({ min: 5, max: 500, precision: 0.01 }).toFixed(2)
      );
    let ex_price = overrides.ex_price ?? undefined;
    if (ex_price == null && faker.datatype.boolean() && price > 5) {
      const increasePercent = faker.number.float({
        min: 0.05,
        max: 0.4,
        precision: 0.01,
      }); // 5%..40% higher
      ex_price = Number((price * (1 + increasePercent)).toFixed(2));
    }

    const doc = {
      title: overrides.title || faker.commerce.productName(),
      description: overrides.description || faker.lorem.paragraph(),
      price,
      ex_price,
      stock: overrides.stock ?? faker.number.int({ min: 0, max: 200 }),
      categories: categoryIds.map((c) =>
        typeof c === 'string' ? mongoose.Types.ObjectId(c) : c
      ),
      primaryImage:
        overrides.primaryImage ||
        `/uploads/products/${faker.string.uuid()}.webp`,
      secondaryImages:
        Array.isArray(overrides.secondaryImages) &&
        overrides.secondaryImages.length
          ? overrides.secondaryImages
          : Array.from(
              { length: faker.number.int({ min: 0, max: 3 }) },
              () => `/uploads/products/${faker.string.uuid()}.webp`
            ),
      published:
        typeof overrides.published === 'boolean'
          ? overrides.published
          : faker.datatype.boolean(),
      seller_id: overrides.seller_id || overrides.sellerId || sellerId,
      ...overrides,
    };

    // create in DB
    const p = await Product.create(doc);
    products.push(p);
  }

  return products;
};

export default productFactory;
