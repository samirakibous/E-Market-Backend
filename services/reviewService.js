import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// check if user bought the product
export const hasUserPurchasedProduct = async (userId, productId) => {
  const order = await Order.findOne({
    userId,
    'items.productId': productId,
    status: { $in: ['delivered', 'shipped'] },
  });
  return !!order;
};

export const updateProductRating = async (productId) => {
  const { averageRating, totalReviews } =
    await Review.calculateAverageRating(productId);

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    totalReviews,
  });

  return { averageRating, totalReviews };
};

// check all the conditions before create feedback
export const canUserReview = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) return { canReview: false, reason: 'Product not found' };

  const hasPurchased = await hasUserPurchasedProduct(userId, productId);
  if (!hasPurchased)
    return {
      canReview: false,
      reason: 'You must purchase this product before reviewing',
    };

  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
  });
  if (existingReview)
    return {
      canReview: false,
      reason: 'You have already reviewed this product',
    };

  return { canReview: true };
};

export const getUserReviewForProduct = async (userId, productId) => {
  return await Review.findOne({ user: userId, product: productId })
    .populate('product', 'title images')
    .populate('user', 'fullname avatar');
};
