import Product from '../models/Product.js';

class StockService {
  // Check if product has enough stock
  static async checkStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Insufficient stock');
    return true;
  }

  // Decrease stock
  static async decreaseStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Insufficient stock');

    product.stock -= quantity;
    await product.save();
    return product;
  }

  // Increase stock
  static async increaseStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    product.stock += quantity;
    await product.save();
    return product;
  }
}

export default StockService;
