require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error(
          'ALLOWED_ORIGINS environment variable is required in production',
        );
      })()
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      status: 'failure',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api', generalLimiter);
}

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/testimonials', testimonialRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    status: 'success',
    message: 'Server is running perfectly',
  });
});

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    status: 'failure',
    message: 'Route not found.',
  });
});

app.use(errorHandler);

module.exports = app;
