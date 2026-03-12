const rateLimit = require('express-rate-limit');

// General API rate limiter — 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Stricter limiter for write endpoints — 10 requests per minute per IP
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later' }
});

// Strictest limiter for LLM analysis — 5 requests per minute per IP
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests, please try again later' }
});

module.exports = { generalLimiter, writeLimiter, analyzeLimiter };
