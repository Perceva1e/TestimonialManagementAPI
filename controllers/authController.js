const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Counter = require('../models/counter');
const { success, failure } = require('../lib/helpers');
const { HTTP_STATUS } = require('../lib/constants');

exports.register = async (req, res, next) => {
  try {
    const { email, password, businessName, role } = req.body;

    const candidate = await User.findOne({ email });
    if (candidate) {
      return failure(res, HTTP_STATUS.BAD_REQUEST, 'User with this email already exists.');
    }

    const counter = await Counter.findOneAndUpdate(
      { name: 'userId' },
      { $inc: { value: 1 },
        $setOnInsert: { name: "userId"}},
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
      { expiresIn: process.env.JWT_EXPIRY || "7d"}
    );

    return success(res, HTTP_STATUS.CREATED, 'User registered successfully', {
      user: {
        userId: newUser.userId,
        email: newUser.email,
        businessName: newUser.businessName,
        role: newUser.role,
        isActive: newUser.isActive
      },
      token
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
      return failure(res, HTTP_STATUS.BAD_REQUEST, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return failure(res, HTTP_STATUS.FORBIDDEN, "User account is inactive.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return failure(res, HTTP_STATUS.BAD_REQUEST, 'Invalid email or password.');
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d"}
    );

    return success(res, HTTP_STATUS.OK, 'Logged in successfully', { token });

  } catch (error) {
    next(error);
  }
};