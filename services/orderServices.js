import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import StockService from './StockService.js';
import DiscountService from './discountService.js';

class OrderService {
  static async createOrder(userId, couponCodes, session = null ) {
    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .session(session);

    if (!cart || !cart.items.length) throw new Error('Cart is empty');

    // Check & decrease stock
    for (const item of cart.items) {
      await StockService.checkStock(item.productId._id, item.quantity);
      await StockService.decreaseStock(item.productId._id, item.quantity);
    }

    // Calculate total
    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.productId.price * i.quantity,
      0
    );

    // Validate coupons
    let totalDiscount = 0;
    const appliedCouponIds = [];
    const validCoupons = [];

    for (const code of couponCodes) {
      const { valid, coupon, message } =
        await DiscountService.validateCouponForUser(code, userId, totalAmount);

      if (!valid) {
        throw new Error(`Coupon "${code}" is invalid: ${message}`);
      }

      const discount = DiscountService.calculateDiscount(coupon, totalAmount);
      totalDiscount += discount;

      appliedCouponIds.push(coupon._id);
      validCoupons.push({ code, discount });
    }

    // Calculate final amount after discount
    const finalAmount = Math.max(totalAmount - totalDiscount, 0);

    // Create order
    const [order] = await Order.create(
      [
        {
          userId,
          items: cart.items.map((i) => ({
            productId: i.productId._id,
            quantity: i.quantity,
            price: i.productId.price,
          })),
          totalAmount,
          discount: totalDiscount,
          finalAmount,
          appliedCoupons: appliedCouponIds,
          status: 'pending',
        },
      ]);

    // Mark coupons as used
    for (const c of validCoupons) {
      await DiscountService.applyCouponToOrder(c.code, userId, order._id);
    }

    return { order, appliedCoupons: validCoupons };
  }
}

export default OrderService;
