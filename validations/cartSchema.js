import * as yup from 'yup';

export const cartSchema = yup.object({
  productId: yup.string().required('Product ID is required'),
  quantity: yup
    .number()
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1'),
});
