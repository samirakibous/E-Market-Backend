import mongoose from 'mongoose';
import softDeletePlugin from './plugins/softDeletePlugin.js';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minLength: [6, 'Code must be at least 6 characters'],
    maxLength: [20, 'Code must not exceed 20 characters'],
  },
  type: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: {
      values: ['percentage', 'fixed'],
      massage: 'Type must be either percentage or fixed',
    },
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Value must be positive'],
    validate: {
      validator: function (v) {
        if (this.type === 'percentage') {
          return v <= 100;
        }
        return true;
      },
      message: 'Percentage value connot exceed 100%',
    },
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase cannot be negative'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  expirationDate: {
    type: Date,
    required: [true, 'Expiration date is required'],
    validate: {
      validator: function (v) {
        if (!this.startDate || !v) return true;
        return new Date(v) > new Date(this.startDate);
      },
      message: 'Expiration date must be after start date',
    },
  },
  maxUsage: {
    type: Number,
    default: null,
    min: [1, 'Max usage must be at least 1'],
  },
  maxUsagePerUser: {
    type: Number,
    default: 1,
    min: [1, 'Max usage per user must be at least 1'],
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive',
    },
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  usedBy: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      usedAt: {
        type: Date,
        default: Date.now,
      },
      usageCount: {
        type: Number,
        default: 1,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});
couponSchema.plugin(softDeletePlugin);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
