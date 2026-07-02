const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

exports.register = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Request body is missing.'
      });
    }

    const { email, password, businessName, role } = req.body;

    if (!email || !password || !businessName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Email, password and business name are required.'
      });
    }

    const candidate = await User.findOne({ email });
    if (candidate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'User with this email already exists.'
      });
    }

    const lastUser = await User.findOne().sort({ userId: -1 });
    const nextUserId = lastUser ? lastUser.userId + 1 : 1;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      userId: nextUserId,
      email,
      password: hashedPassword,
      businessName,
      role: role
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser.userId, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    return res.status(HTTP_STATUS.CREATED).json({
      code: HTTP_STATUS.CREATED,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'User registered successfully',
      data: {
        user: {
          userId: newUser.userId,
          email: newUser.email,
          businessName: newUser.businessName,
          role: newUser.role,
          isActive: newUser.isActive
        },
        token
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: messages.join(', ') 
      });
    }

    console.error('Registration error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Request body is missing.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'Logged in successfully',
      data: { token }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};