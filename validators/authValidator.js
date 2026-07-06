const Joi = require("joi");

const registerSchema = Joi.object({

    email: Joi.string()
        .email()
        .trim()
        .required(),

    password: Joi.string()
        .min(8)
        .max(64)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        .required()
        .messages({
            "string.pattern.base":
                "Password must contain uppercase, lowercase and number."
        }),

    businessName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()

});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .trim()
        .required(),
    password: Joi.string()
        .required()
});

module.exports = {
    registerSchema,
    loginSchema
};