const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    statusCode,
    error: err.name || 'Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    message: err.customMessage || err.message || 'Something went wrong',
  });
};

export default errorHandler;
