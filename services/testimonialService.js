const Testimonial = require('../models/testimonial');
const { HTTP_STATUS } = require('../lib/constants');

const STATUS_TRANSITIONS = {
    draft: 'recording',
    recording: 'processing',
    processing: 'completed',
    completed: 'shared'
};

const createTestimonial = async (data, userId) => {
    const { customerName, customerEmail, customerPhone, rating, text, videoUrl, consentGiven } = data;
    
    const newTestimonial = new Testimonial({
        testimonialId: require('uuid').v4(),
        userId,
        customerName,
        customerEmail,
        customerPhone,
        rating,
        text,
        videoUrl,
        consentGiven,
        status: 'draft'
    });

    return await newTestimonial.save();
};

const getTestimonials = async (userId, filters) => {
    const { status, page = 1, limit = 10, sort = 'createdAt' } = filters;

    const queryFilter = {
        userId,
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

    return {
        testimonials,
        pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(totalCount / Number(limit))
        }
    };
};

const getTestimonialById = async (testimonialId, userId) => {
    const testimonial = await Testimonial.findOne({
        testimonialId,
        isDeleted: false
    });

    if (!testimonial) {
        return { testimonial: null, error: 'not_found' };
    }

    if (testimonial.userId !== userId) {
        return { testimonial: null, error: 'forbidden' };
    }

    return { testimonial };
};

const updateTestimonial = async (testimonialId, userId, updateData) => {
    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
    
    if (!testimonial) {
        return { testimonial: null, error: 'not_found' };
    }

    if (testimonial.userId !== userId) {
        return { testimonial: null, error: 'forbidden' };
    }

    const allowedFields = [
        'customerName',
        'customerEmail',
        'customerPhone',
        'rating',
        'text',
        'videoUrl',
        'consentGiven'
    ];

    const filteredUpdate = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            filteredUpdate[field] = updateData[field];
        }
    });

    Object.assign(testimonial, filteredUpdate);
    return { testimonial: await testimonial.save() };
};

const updateStatus = async (testimonialId, userId, newStatus) => {
    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
    
    if (!testimonial) {
        return { testimonial: null, error: 'not_found' };
    }

    if (testimonial.userId !== userId) {
        return { testimonial: null, error: 'forbidden' };
    }

    if (STATUS_TRANSITIONS[testimonial.status] !== newStatus) {
        return { 
            testimonial, 
            error: 'invalid_transition', 
            currentStatus: testimonial.status,
            newStatus 
        };
    }

    testimonial.status = newStatus;
    
    if (newStatus === 'shared') {
        testimonial.sharedAt = new Date();
    }

    return { testimonial: await testimonial.save() };
};

const shareTestimonial = async (testimonialId, userId, channels) => {
    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
    
    if (!testimonial) {
        return { testimonial: null, error: 'not_found' };
    }

    if (testimonial.userId !== userId) {
        return { testimonial: null, error: 'forbidden' };
    }

    if (testimonial.status !== 'completed' && testimonial.status !== 'shared') {
        return { testimonial, error: 'invalid_status' };
    }

    channels.forEach(channel => {
        if (!testimonial.sharedChannels.includes(channel)) {
            testimonial.sharedChannels.push(channel);
        }
    });

    if (testimonial.status === 'completed') {
        testimonial.status = 'shared';
    }

    if (!testimonial.sharedAt) {
        testimonial.sharedAt = new Date();
    }

    return { testimonial: await testimonial.save() };
};


const deleteTestimonial = async (testimonialId, userId) => {
    const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
    
    if (!testimonial) {
        return { testimonial: null, error: 'not_found' };
    }

    if (testimonial.userId !== userId) {
        return { testimonial: null, error: 'forbidden' };
    }

    testimonial.isDeleted = true;
    testimonial.deletedAt = new Date();
    return { testimonial: await testimonial.save() };
};

const isOwner = (testimonial, userId) => {
    return testimonial && testimonial.userId === userId;
};

module.exports = {
    createTestimonial,
    getTestimonials,
    getTestimonialById,
    updateTestimonial,
    updateStatus,
    shareTestimonial,
    deleteTestimonial,
    isOwner,
    STATUS_TRANSITIONS
};