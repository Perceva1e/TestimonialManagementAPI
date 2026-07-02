const Testimonial = require('../models/testimonial');
const TestimonialSettings = require('../models/testimonialSettings');
const { v4: uuidv4 } = require('uuid');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

exports.createTestimonial = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, rating, text, videoUrl } = req.body;

    if (!customerName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Customer name is required.'
      });
    }

    const newTestimonial = new Testimonial({
      testimonialId: uuidv4(), 
      userId: req.user.userId,  
      customerName,
      customerEmail,
      customerPhone,
      rating,
      text,
      videoUrl,
      status: 'draft' 
    });

    await newTestimonial.save();

    return res.status(HTTP_STATUS.CREATED).json({
      code: HTTP_STATUS.CREATED,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'Testimonial created successfully.',
      data: newTestimonial
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const { status, page = 1, limit = 10 } = req.query;

    const queryFilter = {
      userId: currentUserId,
      isDeleted: false
    };

    if (status) {
      queryFilter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [testimonials, totalCount] = await Promise.all([
      Testimonial.find(queryFilter)
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(parseInt(limit)),
      Testimonial.countDocuments(queryFilter)
    ]);

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      data: {
        testimonials,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};

exports.updateTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const currentUserId = req.user.userId;
    const updateData = req.body;

    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
    
    if (!testimonial) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: HTTP_STATUS.NOT_FOUND,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Testimonial not found.'
      });
    }

    if (testimonial.userId !== currentUserId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: HTTP_STATUS.FORBIDDEN,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Forbidden. You do not own this testimonial.'
      });
    }

    delete updateData.testimonialId;
    delete updateData.userId;
    delete updateData.isDeleted;

    Object.assign(testimonial, updateData);
    await testimonial.save();

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'Testimonial updated successfully.',
      data: testimonial
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const currentUserId = req.user.userId;

    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });

    if (!testimonial) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: HTTP_STATUS.NOT_FOUND,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Testimonial not found.'
      });
    }

    if (testimonial.userId !== currentUserId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: HTTP_STATUS.FORBIDDEN,
        status: RESPONSE_STATUS.FAILURE,
        message: 'Forbidden. You do not own this testimonial.'
      });
    }

    testimonial.isDeleted = true;
    testimonial.deletedAt = new Date();
    await testimonial.save();

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'Testimonial deleted successfully.'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.FAILURE,
      message: 'Internal server error.'
    });
  }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await TestimonialSettings.findOne({
            userId: req.user.userId
        });
        
        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Settings retrieved successfully",
            data: settings || null
        });
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            status: RESPONSE_STATUS.FAILURE,
            message: "Internal server error."
        });

    }
};

exports.upsertSettings = async (req, res) => {
    try {
        const updateData = req.body;
        delete updateData.userId;
        const settings = await TestimonialSettings.findOneAndUpdate(
            {
                userId: req.user.userId
            },
            {
                $set: updateData
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Settings saved successfully",
            data: settings
        });
    } catch (error) {
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            status: RESPONSE_STATUS.FAILURE,
            message: "Internal server error."
        });
    }
};
exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        const matchStage = {
            userId,
            isDeleted: false
        };

        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                code: HTTP_STATUS.BAD_REQUEST,
                status: RESPONSE_STATUS.FAILURE,
                message: "Invalid startDate format."
            });
        }

        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                code: HTTP_STATUS.BAD_REQUEST,
                status: RESPONSE_STATUS.FAILURE,
                message: "Invalid endDate format."
            });
        }
        
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) {
                matchStage.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                matchStage.createdAt.$lte = new Date(endDate);
            }
        }

        const analytics = await Testimonial.aggregate([
            {
              $match: matchStage
            },
            {
              $facet: {
                  overview: [
                      {
                          $group: {
                              _id: null,
                              total: {
                                  $sum: 1
                              },
                              averageRating: {
                                  $avg: "$rating"
                              }
                          }
                      }
                  ],
                  byStatus: [
                      {
                          $group: {
                              _id: "$status",
                              count: {
                                  $sum: 1
                              }
                          }
                      }
                  ]
              }
            }
        ]);

        const overview = analytics[0].overview[0] || {
            total: 0,
            averageRating: 0
        };

        const statusCounts = {
            draft: 0,
            recording: 0,
            processing: 0,
            completed: 0,
            shared: 0
        };

        analytics[0].byStatus.forEach(item => {
            statusCounts[item._id] = item.count;
        });

        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Data retrieved successfully",
            data: {
                overview: {
                    total: overview.total,
                    byStatus: statusCounts,
                    averageRating: Number(
                        (overview.averageRating || 0).toFixed(1)
                    )
                },
                period: {
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            }
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            status: RESPONSE_STATUS.FAILURE,
            message: "Internal server error."
        });
    }
};