const { HTTP_STATUS, RESPONSE_STATUS } = require('../lib/constants');

module.exports = (err, req, res, next) => {

    console.error(err);

    if (err.name === "ValidationError") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            code: HTTP_STATUS.BAD_REQUEST,
            status: RESPONSE_STATUS.FAILURE,
            message: Object.values(err.errors)
                .map(e => e.message)
                .join(", ")
        });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        status: RESPONSE_STATUS.FAILURE,
        message: "Internal server error."
    });

};