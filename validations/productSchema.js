import * as yup from 'yup';

export const productSchema = yup.object({
  title: yup
    .string()
    .required('Product title is required')
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title must be less than 100 characters'),

  description: yup
    .string()
    .required('Product description is required')
    .max(1000, 'Description must be less than 1000 characters'),

  price: yup
    .number()
    .required('Product price is required')
    .min(0, 'Price cannot be negative'),

  ex_price: yup.number().positive().nullable(),

  stock: yup
    .number()
    .integer()
    .required('Product stock is required')
    .min(0, 'Stock cannot be negative'),

  categories: yup
    .array()
    .of(yup.string().required('Category ID must be a string'))
    .required('At least one category is required'),

  primaryImage: yup.string().url().notRequired().nullable(),

  secondaryImages: yup.array().of(yup.string().url()).notRequired(),

  published: yup.boolean().notRequired().default(false),

  seller_id: yup.string().required('Seller ID is required'),
  // images: yup
  //     .array()
  //     .required()
  //     .of(
  //         yup
  //             .string()
  //             .matches(
  //                 /^[\w,\s-]+(\.[A-Za-z]{3,4})$|^([\w,\s-]+\/)+[\w,\s-]+\.[A-Za-z]{3,4}$/,
  //                 "Each image must be a valid filename or file path"
  //             )
  //     )
  //     .min(1, "At least one image is required"),

  createdAt: yup.date().default(() => new Date()),
});
