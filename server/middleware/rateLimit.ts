import rateLimit from 'express-rate-limit';

// Rate limit for public reports submission: max 5 requests per 15 minutes per IP
export const reportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak laporan dari alamat IP Anda. Silakan coba kembali setelah 15 menit demi mencegah spam.'
  }
});

// General API rate limiter for search & public endpoints
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Batas permintaan API terlampaui. Silakan tunggu sesaat.'
  }
});
