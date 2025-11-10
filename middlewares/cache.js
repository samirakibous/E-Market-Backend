// middlewares/cache.js
import cacheService from '../services/cacheService.js';

export const cacheMiddleware = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey(prefix, req.query);
    console.log(`🔍 Cache check for key: ${cacheKey}`);

    try {
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS for key: ${cacheKey}`);

      const originalJson = res.json;
      res.json = function (data) {
        if (res.statusCode === 200) {
          // Ne pas cacher si les données sont vides
          const hasData = data && data.data && data.data.length > 0;
          if (hasData) {
            console.log(`💾 Caching data for key: ${cacheKey}`);
            cacheService.set(cacheKey, data, ttl);
          } else {
            console.log(`⚠️ Not caching empty data for key: ${cacheKey}`);
          }
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};
