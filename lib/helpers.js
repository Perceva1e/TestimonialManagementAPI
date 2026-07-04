const { HTTP_STATUS, RESPONSE_STATUS } = require('./constants');

const success = (res, code = HTTP_STATUS.OK, message = 'Success', data = null, extra = {}) => {
    return res.status(code).json({
        code,
        status: RESPONSE_STATUS.SUCCESS,
        message,
        data,
        ...extra
    });
};

const failure = (res, code = HTTP_STATUS.BAD_REQUEST, message = 'Error') => {
    return res.status(code).json({
        code,
        status: RESPONSE_STATUS.FAILURE,
        message
    });
};

module.exports = {
    success,
    failure
};