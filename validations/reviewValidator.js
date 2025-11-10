import * as yup from 'yup';
import mongoose from 'mongoose';

export const createReviewSchema = yup.object({
  productId: yup
    .string()
    .required('Product ID is required')
    .test('is-valid-objectid', 'Invalid product ID', (value) =>
      mongoose.Types.ObjectId.isValid(value)
    ),

  rating: yup
    .number()
    .required('Rating is required')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),

  comment: yup
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
});

export const updateReviewSchema = yup.object({
  rating: yup
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),

  comment: yup
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
});

export const moderateReviewSchema = yup.object({
  status: yup
    .string()
    .required('Status is required')
    .oneOf(
      ['pending', 'approved', 'rejected'],
      'Status must be pending, approved, or rejected'
    ),
});
