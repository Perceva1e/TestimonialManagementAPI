const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Access denied. No token provided.',
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ userId: decoded.userId, isActive: true });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAILURE,
        message: 'User not found or account is deactivated.',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      code: HTTP_STATUS.UNAUTHORIZED,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Invalid or expired token.',
    });
  }
};
