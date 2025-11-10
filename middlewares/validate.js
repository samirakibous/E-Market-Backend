const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    const errors = {};
    err.inner.forEach((e) => {
      if (!errors[e.path]) {
        errors[e.path] = e.message;
      }
    });
    res.status(400).json({ errors });
  }
};

export default validate;
