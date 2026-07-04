const TestimonialSettings = require('../models/testimonialSettings');

const getSettings = async (userId) => {
    return await TestimonialSettings.findOne({ userId });
};

const upsertSettings = async (userId, updateData) => {
    const allowedFields = [
        'isEnabled',
        'defaultVideoLength',
        'videoLengthOptions',
        'questionnaire',
        'sendingOptions',
        'thankYouMessage',
        'contactConsent'
    ];

    const filteredUpdate = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            filteredUpdate[field] = updateData[field];
        }
    });

    return await TestimonialSettings.findOneAndUpdate(
        { userId },
        { $set: filteredUpdate },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        }
    );
};

module.exports = {
    getSettings,
    upsertSettings
};