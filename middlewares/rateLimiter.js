import rateLimit from 'express-rate-limit';
const skipIfTest = process.env.NODE_ENV === 'test';

const attempts = new Map();
const reviewAttempts = new Map();

export const couponRateLimit = (req, res, next) => {
  const key = req.ip + req.body?.code;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 5;

  if (!attempts.has(key)) {
    attempts.set(key, []);
  }

  const userAttempts = attempts.get(key);
  const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    logFailedValidation(req, 'Rate limit exceeded');
    return res
      .status(429)
      .json({ error: 'Too many attempts. Try again later.' });
  }

  userAttempts.push(now);
  attempts.set(key, userAttempts.slice(-maxAttempts));
  next();
};

export const reviewRateLimit = (req, res, next) => {
  const key = req.user.id;
  const now = Date.now();
  const windowMs = 3600000; // 1 heure
  const maxAttempts = 3;

  if (!reviewAttempts.has(key)) {
    reviewAttempts.set(key, []);
  }

  const userAttempts = reviewAttempts.get(key);
  const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res
      .status(429)
      .json({ error: 'Too many review attempts. Maximum 3 reviews per hour.' });
  }

  userAttempts.push(now);
  reviewAttempts.set(key, userAttempts.slice(-maxAttempts));
  next();
};

// ============ carte and order  rate limit ============
// get limitter
export const getLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests. Try again later.',
  skip: () => skipIfTest,
});

// (POST, PUT, DELETE) limiter
export const modifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many modifications. Try again later.',
  skip: () => skipIfTest,
});

const logFailedValidation = (req, reason) => {
  const logEntry = `[${new Date().toISOString()}] COUPON_VALIDATION_FAILED - IP: ${req.ip}, Code: ${req.body?.code}, Reason: ${reason}\n`;
  import('fs').then((fs) => {
    fs.appendFile('./logs/coupon-failures.log', logEntry, () => {});
  });
};

export const productRateLimit = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 10; // max 10 requests per minute

  if (!attempts.has(key)) {
    attempts.set(key, []);
  }

  const userAttempts = attempts.get(key);
  const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res
      .status(429)
      .json({ error: 'Too many product requests. Try again later.' });
  }

  userAttempts.push(now);
  attempts.set(key, userAttempts.slice(-maxAttempts));
  next();
};

export { logFailedValidation };
