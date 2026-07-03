const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Counter = require('../models/counter');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

exports.register = async (req, res, next) => {
  try {
    const { email, password, businessName, role } = req.body;

    const candidate = await User.findOne({ email });
    if (candidate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'User with this email already exists.'
      });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: 'userId' },
      { $inc: { value: 1 } },
      {
          new: true,
          upsert: true
      }
    );
    const nextUserId = counter.value;

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
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: HTTP_STATUS.FORBIDDEN,
        status: RESPONSE_STATUS.FAILURE,
        message: "User account is inactive."
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
    next(error);
  }
};