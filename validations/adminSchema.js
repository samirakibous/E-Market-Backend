import * as yup from 'yup';

export const adminCreateUserSchema = yup.object({
  fullname: yup
    .string()
    .label('Full Name')
    .required()
    .min(3, 'Full name must be at least 3 characters long'),

  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),

  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .nullable()
    .optional(), // Password optionnel - généré automatiquement côté serveur

  role: yup
    .string()
    .oneOf(['user', 'admin', 'seller'], 'Invalid role')
    .default('user'),
});