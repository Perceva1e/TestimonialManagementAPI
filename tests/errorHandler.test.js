process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
process.env.NODE_ENV = 'test';

const errorHandler = require('../middleware/errorHandler');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('should handle ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        password: { message: 'Password is too short' },
      },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Email is required, Password is too short',
    });
  });

  test('should handle duplicate key error (code 11000) for email', () => {
    const err = {
      code: 11000,
      keyPattern: { email: 1 },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Duplicate value for email. This email is already in use.',
    });
  });

  test('should handle duplicate key error (code 11000) for userId', () => {
    const err = {
      code: 11000,
      keyPattern: { userId: 1 },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Duplicate value for userId. This userId is already in use.',
    });
  });

  test('should handle duplicate key error with keyValue fallback', () => {
    const err = {
      code: 11000,
      keyValue: { testimonialId: '123' },
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.BAD_REQUEST,
      status: RESPONSE_STATUS.FAILURE,
      message:
        'Duplicate value for testimonialId. This testimonialId is already in use.',
    });
  });

  test('should handle CORS error', () => {
    const err = new Error('Not allowed by CORS');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.FORBIDDEN,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Access denied by CORS policy.',
    });
  });

  test('should handle generic errors with 500', () => {
    const err = new Error('Something went wrong');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.',
    });
  });

  test('should log error to console', () => {
    const err = new Error('Test error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    errorHandler(err, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(err);

    consoleSpy.mockRestore();
  });
});
