const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Counter = require('../models/counter');
const { success, failure } = require('../lib/helpers');
const { HTTP_STATUS } = require('../lib/constants');

const isTransientTransactionError = (error) => {
  return error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
};

const withTransactionRetry = async (fn, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const result = await fn(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      if (isTransientTransactionError(error) && attempt < maxRetries - 1) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        continue;
      }
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, businessName } = req.body;
    
    const result = await withTransactionRetry(async (session) => {
      const candidate = await User.findOne({ email: email.toLowerCase() }).session(session);
      if (candidate) {
        const error = new Error('User with this email already exists.');
        error.isDuplicate = true;
        throw error;
      }

      const counter = await Counter.findOneAndUpdate(
        { name: 'userId' },
        { $inc: { value: 1 },
          $setOnInsert: { name: "userId"}},
        {
            new: true,
            upsert: true,
            session: session
        }
      );
      const nextUserId = counter.value;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        userId: nextUserId,
        email,
        password: hashedPassword,
        businessName
      });

      await newUser.save({ session });

      const token = jwt.sign(
        { userId: newUser.userId, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || "7d"}
      );

      return {
        user: {
          userId: newUser.userId,
          email: newUser.email,
          businessName: newUser.businessName,
          role: newUser.role,
          isActive: newUser.isActive
        },
        token
      };
    });

    return success(res, HTTP_STATUS.CREATED, 'User registered successfully', result);

  } catch (error) {
    if (error.isDuplicate) {
      return failure(res, HTTP_STATUS.BAD_REQUEST, error.message);
    }
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