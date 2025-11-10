import mongoose from 'mongoose';
import softDeletePlugin from './plugins/softDeletePlugin.js';
// import publishedPlugin from "./plugins/publishedPlugin.js";
import publishedPlugin from './plugins/publishedPlugin.js';
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  ex_price: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  categories: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: 'Category',
  },
  primaryImage: {
    type: String,
    required: false,
  },
  secondaryImages: {
    type: [String],
    default: [],
  },
  published: {
    type: Boolean,
    default: false,
  },
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

productSchema.plugin(softDeletePlugin);
productSchema.plugin(publishedPlugin);

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
