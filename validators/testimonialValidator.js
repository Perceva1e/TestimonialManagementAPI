const Joi = require("joi");

const testimonialStatuses = [
    "draft",
    "recording",
    "processing",
    "completed",
    "shared"
];

const createTestimonialSchema = Joi.object({
    customerName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),

    customerEmail: Joi.string()
        .email()
        .allow("")
        .optional(),

    customerPhone: Joi.string()
        .pattern(/^\+?[\d\s\-()]{7,20}$/)
        .allow("")
        .optional(),

    videoUrl: Joi.string()
        .uri()
        .allow("")
        .optional(),

    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .optional(),

    text: Joi.string()
        .max(5000)
        .allow("")
        .optional(),

    consentGiven: Joi.boolean()
        .optional(),

    status: Joi.string()
        .valid(...testimonialStatuses)
        .optional()
});

const updateTestimonialSchema = Joi.object({
    customerName: Joi.string().trim().min(2).max(100),

    customerEmail: Joi.string().email().allow(""),

    customerPhone: Joi.string()
        .pattern(/^\+?[\d\s\-()]{7,20}$/)
        .allow(""),

    videoUrl: Joi.string().uri().allow(""),

    rating: Joi.number()
        .integer()
        .min(1)
        .max(5),

    text: Joi.string()
        .max(5000)
        .allow(""),

    consentGiven: Joi.boolean()

}).min(1);

const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...testimonialStatuses)
        .required()
});

const shareSchema = Joi.object({
    channels: Joi.array()
        .items(
            Joi.string().valid(
                "email",
                "sms",
                "facebook",
                "instagram"
            )
        )
        .min(1)
        .required()
});

module.exports = {
    createTestimonialSchema,
    updateTestimonialSchema,
    updateStatusSchema,
    shareSchema
};