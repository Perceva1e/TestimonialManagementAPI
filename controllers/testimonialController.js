const { success, failure } = require('../lib/helpers');
const { HTTP_STATUS } = require('../lib/constants');
const testimonialService = require('../services/testimonialService');

exports.createTestimonial = async (req, res, next) => {
    try {
        const testimonial = await testimonialService.createTestimonial(req.body, req.user.userId);
        return success(res, HTTP_STATUS.CREATED, 'Testimonial created successfully.', testimonial);
    } catch (error) {
        next(error);
    }
};

exports.getTestimonials = async (req, res, next) => {
    try {
        const { testimonials, pagination } = await testimonialService.getTestimonials(req.user.userId, req.query);
        return success(res, HTTP_STATUS.OK, 'Data retrieved successfully', testimonials, { pagination });
    } catch (error) {
        next(error);
    }
};

exports.getTestimonialById = async (req, res, next) => {
    try {
        const result = await testimonialService.getTestimonialById(req.params.testimonialId, req.user.userId);

        if (!result.testimonial) {
            if (result.error === 'not_found') {
                return failure(res, HTTP_STATUS.NOT_FOUND, 'Testimonial not found.');
            }
            if (result.error === 'forbidden') {
                return failure(res, HTTP_STATUS.FORBIDDEN, 'Forbidden. You do not own this testimonial.');
            }
        }

        return success(res, HTTP_STATUS.OK, 'Data retrieved successfully', result.testimonial);
    } catch (error) {
        next(error);
    }
};

exports.updateTestimonial = async (req, res, next) => {
    try {
        const result = await testimonialService.updateTestimonial(
            req.params.testimonialId,
            req.user.userId,
            req.body
        );

        if (!result.testimonial) {
            if (result.error === 'not_found') {
                return failure(res, HTTP_STATUS.NOT_FOUND, 'Testimonial not found.');
            }
            if (result.error === 'forbidden') {
                return failure(res, HTTP_STATUS.FORBIDDEN, 'Forbidden. You do not own this testimonial.');
            }
        }

        return success(res, HTTP_STATUS.OK, 'Testimonial updated successfully.', result.testimonial);
    } catch (error) {
        next(error);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const result = await testimonialService.updateStatus(
            req.params.testimonialId,
            req.user.userId,
            status
        );

        if (!result.testimonial) {
            if (result.error === 'not_found') {
                return failure(res, HTTP_STATUS.NOT_FOUND, 'Testimonial not found.');
            }
            if (result.error === 'forbidden') {
                return failure(res, HTTP_STATUS.FORBIDDEN, 'Forbidden. You do not own this testimonial.');
            }
        }

        if (result.error === 'invalid_transition') {
            return failure(
                res,
                HTTP_STATUS.BAD_REQUEST,
                `Cannot transition from ${result.currentStatus} to ${result.newStatus}.`
            );
        }

        return success(res, HTTP_STATUS.OK, 'Status updated successfully.', result.testimonial);
    } catch (error) {
        next(error);
    }
};

exports.shareTestimonial = async (req, res, next) => {
    try {
        const { channels } = req.body;
        const result = await testimonialService.shareTestimonial(
            req.params.testimonialId,
            req.user.userId,
            channels
        );

        if (!result.testimonial) {
            if (result.error === 'not_found') {
                return failure(res, HTTP_STATUS.NOT_FOUND, 'Testimonial not found.');
            }
            if (result.error === 'forbidden') {
                return failure(res, HTTP_STATUS.FORBIDDEN, 'Forbidden. You do not own this testimonial.');
            }
        }

        if (result.error === 'invalid_status') {
            return failure(res, HTTP_STATUS.BAD_REQUEST, 'Only completed testimonials can be shared.');
        }

        return success(res, HTTP_STATUS.OK, 'Testimonial shared successfully.', result.testimonial);
    } catch (error) {
        next(error);
    }
};

exports.deleteTestimonial = async (req, res, next) => {
    try {
        const result = await testimonialService.deleteTestimonial(
            req.params.testimonialId,
            req.user.userId
        );

        if (!result.testimonial) {
            if (result.error === 'not_found') {
                return failure(res, HTTP_STATUS.NOT_FOUND, 'Testimonial not found.');
            }
            if (result.error === 'forbidden') {
                return failure(res, HTTP_STATUS.FORBIDDEN, 'Forbidden. You do not own this testimonial.');
            }
        }

        return success(res, HTTP_STATUS.OK, 'Testimonial deleted successfully.');
    } catch (error) {
        next(error);
    }
};
