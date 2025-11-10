import mongoose from 'mongoose';
import softDeletePlugin from './plugins/softDeletePlugin.js';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // snapshot of product price
      },
    ],
    // Total before any discount
    totalAmount: { type: Number, required: true },

    // Total after discounts/coupons applied
    finalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    appliedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.plugin(softDeletePlugin);

export default mongoose.model('Order', orderSchema);
