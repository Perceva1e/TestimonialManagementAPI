const Testimonial = require('../models/testimonial');

const getAnalytics = async (userId, dateRange = {}) => {
  const { startDate, endDate } = dateRange;

  const matchStage = {
    userId,
    isDeleted: false,
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) {
      matchStage.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = endOfDay;
    }
  }

  const analytics = await Testimonial.aggregate([
    {
      $match: matchStage,
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              averageRating: { $avg: '$rating' },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const overview = analytics[0].overview[0] || {
    total: 0,
    averageRating: 0,
  };

  const statusCounts = {
    draft: 0,
    recording: 0,
    processing: 0,
    completed: 0,
    shared: 0,
  };

  analytics[0].byStatus.forEach((item) => {
    statusCounts[item._id] = item.count;
  });

  return {
    overview: {
      total: overview.total,
      byStatus: statusCounts,
      averageRating: Number((overview.averageRating || 0).toFixed(1)),
    },
    period: {
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    },
  };
};

module.exports = {
  getAnalytics,
};
