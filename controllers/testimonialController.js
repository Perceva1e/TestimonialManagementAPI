const Testimonial = require('../models/testimonial');
const TestimonialSettings = require('../models/testimonialSettings');
const { v4: uuidv4 } = require('uuid');
const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

exports.createTestimonial = async (req, res, next) => {
  try {
    const { customerName, customerEmail, customerPhone, rating, text, videoUrl } = req.body;

    const newTestimonial = new Testimonial({
      testimonialId: uuidv4(), 
      userId: req.user.userId,  
      customerName,
      customerEmail,
      customerPhone,
      rating,
      text,
      videoUrl,
      consentGiven,
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
    next(error)
  }
};

exports.getTestimonials = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    
    const { status, page, limit, sort } = req.query;

    const queryFilter = {
      userId: currentUserId,
      isDeleted: false
    };

    if (status) {
      queryFilter.status = status;
    }
    
    const sortOptions = {};
    sortOptions[sort] = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [testimonials, totalCount] = await Promise.all([
      Testimonial.find(queryFilter)
        .sort(sortOptions) 
        .skip(skip)
        .limit(Number(limit)),
      Testimonial.countDocuments(queryFilter)
    ]);

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: "Data retrieved successfully",
      data: testimonials,
        pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(totalCount / Number(limit))
        }
    });
  } catch (error) {
    next(error)
  }
};

exports.getTestimonialById = async (req, res, next) => {
    try {
        const testimonial = await Testimonial.findOne({
            testimonialId: req.params.testimonialId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                code: HTTP_STATUS.NOT_FOUND,
                status: RESPONSE_STATUS.FAILURE,
                message: "Testimonial not found."
            });
        }

        if (testimonial.userId !== req.user.userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                code: HTTP_STATUS.FORBIDDEN, 
                status: RESPONSE_STATUS.FAILURE, 
                message: "Forbidden. You do not own this testimonial." 
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Data retrieved successfully",
            data: testimonial
        });
    } catch (error) {
        next(error)
    }
};

exports.updateTestimonial = async (req, res, next) => {
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
    
    const allowedFields = [
        "customerName",
        "customerEmail",
        "customerPhone",
        "rating",
        "text",
        "videoUrl",
        "consentGiven"
    ];

    const updateData = {};

    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    Object.assign(testimonial, updateData);
    await testimonial.save();

    return res.status(HTTP_STATUS.OK).json({
      code: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: 'Testimonial updated successfully.',
      data: testimonial
    });
  } catch (error) {
    next(error)
  }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const testimonial = await Testimonial.findOne({
            testimonialId: req.params.testimonialId,
            isDeleted: false
        });
        
        if (!testimonial) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                code: HTTP_STATUS.NOT_FOUND,
                status: RESPONSE_STATUS.FAILURE,
                message: "Testimonial not found."
            });
        }

        if (testimonial.userId !== req.user.userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                code: HTTP_STATUS.FORBIDDEN, 
                status: RESPONSE_STATUS.FAILURE, 
                message: "Forbidden. You do not own this testimonial." 
            });
        }
        
        const transitions = {
            draft: "recording",
            recording: "processing",
            processing: "completed",
            completed: "shared"
        };

        if (transitions[testimonial.status] !== status) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                code: HTTP_STATUS.BAD_REQUEST,
                status: RESPONSE_STATUS.FAILURE,
                message: `Cannot transition from ${testimonial.status} to ${status}.`
            });
        }
        testimonial.status = status;

        if (status === "shared") {
            testimonial.sharedAt = new Date();
        }
        await testimonial.save();

        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Status updated successfully.",
            data: testimonial
        });
    } catch (error) {
        next(error)
    }
};

exports.shareTestimonial = async (req, res, next) => {
    try {
        const { channels } = req.body;
        
        const testimonial = await Testimonial.findOne({
            testimonialId: req.params.testimonialId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                code: HTTP_STATUS.NOT_FOUND,
                status: RESPONSE_STATUS.FAILURE,
                message: "Testimonial not found."
            });
        }

        if (testimonial.userId !== req.user.userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ 
                code: HTTP_STATUS.FORBIDDEN, 
                status: RESPONSE_STATUS.FAILURE, 
                message: "Forbidden. You do not own this testimonial." 
            });
        }

        if (testimonial.status !== "completed" &&
            testimonial.status !== "shared") {

            return res.status(400).json({
                code: 400,
                status: "failure",
                message: "Only completed testimonials can be shared."
            });
        }

        channels.forEach(channel => {
            if (!testimonial.sharedChannels.includes(channel)) {
                testimonial.sharedChannels.push(channel);
            }
        });

        if ( testimonial.status === "completed") {
            testimonial.status = "shared";
        }

        if (!testimonial.sharedAt) {
            testimonial.sharedAt = new Date();
        }
        await testimonial.save();

        return res.status(HTTP_STATUS.OK).json({
            code: HTTP_STATUS.OK,
            status: RESPONSE_STATUS.SUCCESS,
            message: "Testimonial shared successfully.",
            data: testimonial
        });
    } catch (error) {
       next(error)
    }
};

exports.deleteTestimonial = async (req, res, next) => {
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
    next(error)
  }
};

exports.getSettings = async (req, res, next) => {
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
        next(error)
    }
};

exports.upsertSettings = async (req, res, next) => {
    try {
        const allowedFields = [
            "isEnabled",
            "defaultVideoLength",
            "videoLengthOptions",
            "questionnaire",
            "sendingOptions",
            "thankYouMessage",
            "contactConsent"
        ];

        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

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
        next(error)
    }
};

exports.getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        const matchStage = {
            userId,
            isDeleted: false
        };

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
        next(error)
    }
};