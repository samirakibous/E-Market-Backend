import mongoose from 'mongoose';
import softDeletePlugin from './plugins/softDeletePlugin.js';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        lowStockNotified: { type: Boolean, default: false },
      },
    ],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ This ensures one cart per user OR one per session
cartSchema.index({ userId: 1, sessionId: 1 }, { unique: true, sparse: true });

cartSchema.plugin(softDeletePlugin);

export default mongoose.model('Cart', cartSchema);
