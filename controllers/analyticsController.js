const { success, failure } = require('../lib/helpers');
const { HTTP_STATUS } = require('../lib/constants');
const analyticsService = require('../services/analyticsService');

exports.getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getAnalytics(req.user.userId, {
      startDate,
      endDate,
    });
    return success(
      res,
      HTTP_STATUS.OK,
      'Data retrieved successfully',
      analytics,
    );
  } catch (error) {
    next(error);
  }
};
