const { success, failure } = require('../lib/helpers');
const { HTTP_STATUS } = require('../lib/constants');
const settingsService = require('../services/settingsService');

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getSettings(req.user.userId);
        return success(res, HTTP_STATUS.OK, 'Settings retrieved successfully', settings || null);
    } catch (error) {
        next(error);
    }
};

exports.upsertSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.upsertSettings(req.user.userId, req.body);
        return success(res, HTTP_STATUS.OK, 'Settings saved successfully', settings);
    } catch (error) {
        next(error);
    }
};