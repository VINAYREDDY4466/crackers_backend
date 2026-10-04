import rateLimit from 'express-rate-limit';

function buildLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });
}

export const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests. Please wait a moment and try again.',
});

export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: 'Too many login attempts. Please try again in a few minutes.',
});

export const orderLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many order attempts. Please wait a few minutes.',
});

export const analyticsLimiter = buildLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: 'Too many analytics events.',
});
