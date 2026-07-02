require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoute');
const testimonialRoutes = require('./routes/testimonialRoute');

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

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

connectDB();

app.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    status: 'success',
    message: 'Server is running perfectly'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});