const Joi = require("joi");

const settingsSchema = Joi.object({

    isEnabled: Joi.boolean(),

    defaultVideoLength: Joi.number()
        .integer()
        .min(5)
        .max(60),

    videoLengthOptions: Joi.array()
        .items(
            Joi.number()
                .integer()
                .min(5)
                .max(60)
        )
        .min(1),

    questionnaire: Joi.array()
        .items(
            Joi.string()
                .trim()
                .min(1)
                .max(300)
        ),

    sendingOptions: Joi.array()
        .items(
            Joi.string().valid(
                "email",
                "sms",
                "facebook",
                "instagram"
            )
        ),

    thankYouMessage: Joi.string()
        .trim()
        .max(500),

    contactConsent: Joi.object({
        enabled: Joi.boolean(),
        text: Joi.string()
            .trim()
            .max(300)
    })
});
module.exports = {
    settingsSchema
};