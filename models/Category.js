import mongoose from 'mongoose';
import softDeletePlugin from './plugins/softDeletePlugin.js';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
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

categorySchema.plugin(softDeletePlugin);

const Category = mongoose.model('Category', categorySchema);

export default Category;
