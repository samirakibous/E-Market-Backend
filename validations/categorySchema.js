import * as yup from 'yup';

export const categorySchema = yup.object({
  name: yup.string().label('Category name').required().min(3),
});
