require('dotenv').config();

const express = require('express');

const authRoutes = require('./routes/authRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/testimonials', testimonialRoutes);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    status: 'success',
    message: 'Server is running perfectly'
  });
});

app.use(errorHandler);

module.exports = app;