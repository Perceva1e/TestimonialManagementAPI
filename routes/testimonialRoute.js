const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const settingsController = require('../controllers/settingsController');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const validate = require("../middleware/validate");
const {
    createTestimonialSchema,
    updateTestimonialSchema,
    updateStatusSchema,
    shareSchema,
    testimonialIdSchema
} = require("../validators/testimonialValidator");
const { analyticsQuerySchema, testimonialQuerySchema } = require("../validators/queryValidator");
const { settingsSchema } = require("../validators/settingsValidator");

router.use(authMiddleware);

router.get('/settings', settingsController.getSettings);
router.post("/settings", validate(settingsSchema), settingsController.upsertSettings);

router.get("/analytics", validate(analyticsQuerySchema, "query"), analyticsController.getAnalytics);

router.post('/', validate(createTestimonialSchema), testimonialController.createTestimonial);
router.get("/", validate(testimonialQuerySchema, "query"), testimonialController.getTestimonials);

router.get('/:testimonialId', validate(testimonialIdSchema, "params"), testimonialController.getTestimonialById);
router.put('/:testimonialId', validate(testimonialIdSchema, "params"), validate(updateTestimonialSchema), testimonialController.updateTestimonial);
router.patch('/:testimonialId/status', validate(testimonialIdSchema, "params"), validate(updateStatusSchema), testimonialController.updateStatus);
router.post('/:testimonialId/share', validate(testimonialIdSchema, "params"), validate(shareSchema), testimonialController.shareTestimonial);
router.delete('/:testimonialId', validate(testimonialIdSchema, "params"), testimonialController.deleteTestimonial);

module.exports = router;