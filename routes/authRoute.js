const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const validate = require("../middleware/validate")
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');
const {
    registerSchema,
    loginSchema
} = require("../validators/authValidator");

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

router.post(
    "/register",
    registerLimiter,
    validate(registerSchema),
    authController.register
);

router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    authController.login
);

module.exports = router;