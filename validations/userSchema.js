import * as yup from 'yup';

export const userSchema = yup.object({
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
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});
