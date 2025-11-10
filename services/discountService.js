import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
class DiscountService {
  // calcule la réduction
  calculateDiscount(coupon, totalAmount) {
    if (coupon.type === 'percentage') {
      return totalAmount * (coupon.value / 100);
    }
    return Math.min(coupon.value, totalAmount);
  }
  // validation complète
  async validateCouponForUser(couponCode, userId, totalAmount) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }
    // coupon active ??
    if (coupon.status !== 'active') {
      return { valid: false, message: 'Coupon is inactive' };
    }
    // coupon expired ??
    const now = new Date();
    if (now < coupon.startDate || now > coupon.expirationDate) {
      return { valid: false, message: 'Coupon is expired or not yet active' };
    }
    // max purchase
    if (totalAmount < coupon.minimumPurchase) {
      return {
        valid: false,
        message: `Minimum purchase amount is ${coupon.minimumPurchase}`,
      };
    }
    // global uses disponible
    if (coupon.maxUsage && coupon.usedBy.length >= coupon.maxUsage) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
    // maw uses per user
    const userUsage = coupon.usedBy.find(
      (usage) => usage.user.toString() === userId
    );
    if (userUsage && userUsage.usageCount >= coupon.maxUsagePerUser) {
      return { valid: false, message: 'User usage limit reached' };
    }
    return { valid: true, coupon };
  }
  // marque le coupon comme utilise
  async applyCouponToOrder(couponCode, userId) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    const existingUsage = coupon.usedBy.find(
      (usage) => usage.user.toString() === userId
    );

    if (existingUsage) {
      existingUsage.usageCount += 1;
      existingUsage.usedAt = new Date();
    } else {
      coupon.usedBy.push({
        user: userId,
        usedAt: new Date(),
        usageCount: 1,
      });
    }
    await coupon.save();
    return coupon;
  }
  // verifie si l'utilisateur peut utiliser le coupon
  async canUserUseCoupon(couponId, userId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon || coupon.status !== 'active') {
      return false;
    }
    const now = new Date();
    if (now < coupon.startDate || now > coupon.expirationDate) {
      return false;
    }
    if (coupon.maxUsage && coupon.usedBy.length >= coupon.maxUsage) {
      return false;
    }
    const userUsage = coupon.usedBy.find(
      (usage) => usage.user.toString() === userId
    );
    if (userUsage && userUsage.usageCount >= coupon.maxUsagePerUser) {
      return false;
    }
    return true;
  }
}
export default new DiscountService();
