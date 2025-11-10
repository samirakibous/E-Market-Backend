import * as yup from 'yup';

export const couponSchema = yup.object({
  code: yup
    .string()
    .required('Coupon code is required')
    .min(6, 'Code must be at least 6 characters')
    .max(20, 'Code must not exceed 20 characters')
    .uppercase(),

  type: yup
    .string()
    .required('Discount type is required')
    .oneOf(['percentage', 'fixed'], 'Type must be either percentage or fixed'),

  value: yup
    .number()
    .required('Discount value is required')
    .min(0, 'Value must be positive')
    .test(
      'percentage-limit',
      'Percentage value cannot exceed 100%',
      function (value) {
        return this.parent.type !== 'percentage' || value <= 100;
      }
    ),

  minimumPurchase: yup
    .number()
    .min(0, 'Minimum purchase cannot be negative')
    .default(0),

  startDate: yup.date().required('Start date is required'),

  expirationDate: yup
    .date()
    .required('Expiration date is required')
    .test(
      'after-start',
      'Expiration date must be after start date',
      function (value) {
        const startDate = this.parent.startDate;
        if (!startDate || !value) return true;
        return new Date(value) > new Date(startDate);
      }
    ),

  maxUsage: yup.number().min(1, 'Max usage must be at least 1').nullable(),

  maxUsagePerUser: yup
    .number()
    .min(1, 'Max usage per user must be at least 1')
    .default(1),

  status: yup
    .string()
    .oneOf(['active', 'inactive'], 'Status must be either active or inactive')
    .default('active'),

  createdBy: yup.string().required('Creator is required'),
});
