const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(', '),
    });
  }

  if (err.code === 11000) {
    const field =
      Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message: `Duplicate value for ${field}. This ${field} is already in use.`,
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      code: HTTP_STATUS.FORBIDDEN,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Access denied by CORS policy.',
    });
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    status: RESPONSE_STATUS.FAILURE,
    message: 'Internal server error.',
  });
};
