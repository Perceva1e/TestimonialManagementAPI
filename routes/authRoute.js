const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  standardHeaders: true, 
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      status: 'failure',
      message: 'Too many login attempts from this IP, please try again after a minute.'
    });
  }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 10, 
    handler: (req, res) => {
      res.status(429).json({
        code: 429,
        status: 'failure',
        message: 'Too many registration attempts, please try again later.'
      });
    }
  });

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

module.exports = router;