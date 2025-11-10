import logger from '../config/logger.js';

const requestLogger = (req, res, next) => {
  res.on('finish', () => {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
    res.statusCode >= 400 ? logger.warn(message) : logger.info(message);
  });
  next();
};

export default requestLogger;
