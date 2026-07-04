const { HTTP_STATUS, RESPONSE_STATUS } = require("../lib/constants");

module.exports = (schema, property = "body") => {
    return (req, res, next) => {
        const { error, value } =
            schema.validate(req[property], {
                abortEarly: false,
                allowUnknown: false
            });
        if (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                code: HTTP_STATUS.BAD_REQUEST,
                status: RESPONSE_STATUS.FAILURE,
                message: error.details
                    .map(e => e.message)
                    .join(", ")
            });
        }
        req[property] = value;
        next();
    };
};