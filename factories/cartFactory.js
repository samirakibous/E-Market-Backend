import Cart from '../models/Cart.js';
import { faker } from '@faker-js/faker';
import Product from '../models/Product.js';
import User from '../models/User.js';

/**
 * Creates one or more carts in the database.
 * If userId is provided, sessionId will be null.
 * @param {number} count - Number of carts to create (default 1)
 * @param {Object} overrides - Optional overrides (userId, items, etc.)
 * @returns {Promise<Cart[]>} - Array of created cart documents
 */
export const cartFactory = async (count = 1, overrides = {}) => {
  const carts = [];

  const seller = await User.findOne({ role: 'seller' });
  if (!seller) {
    throw new Error('Aucun vendeur trouvé dans la base de données.');
  }
  for (let i = 0; i < count; i++) {
    // If no productId provided, create one real product
    let productId = overrides.productId;
    if (!productId) {
      const product = await Product.create({
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.number.float({ min: 5, max: 100, multipleOf: 0.01 }),
        category: overrides.categoryId || null,
        stock: faker.number.int({ min: 10, max: 100 }),
        seller_id: seller._id,
      });
      productId = product._id;
    }

    const isUser = !!overrides.userId;
    const cart = await Cart.create({
      userId: overrides.userId || null,
      sessionId: isUser ? null : overrides.sessionId || faker.string.uuid(),
      items: overrides.items || [
        {
          productId,
          quantity: faker.number.int({ min: 1, max: 5 }),
        },
      ],
      ...overrides,
    });

    carts.push(cart);
  }

  return carts;
};
