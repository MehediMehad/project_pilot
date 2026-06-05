import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Limit each IP to 3000 requests per windowMs in dev/testing
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit login attempts to 100
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
    });
  },
  skipSuccessfulRequests: true,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many payment attempts, please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
