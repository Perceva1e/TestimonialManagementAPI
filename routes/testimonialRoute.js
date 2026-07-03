const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/auth');
const validate = require("../middleware/validate");
const {
    createTestimonialSchema,
    updateTestimonialSchema,
    updateStatusSchema,
    shareSchema
} = require("../validators/testimonialValidator");
const { analyticsQuerySchema,testimonialQuerySchema } = require("../validators/queryValidator");
const { settingsSchema } = require("../validators/settingsValidator");

router.use(authMiddleware);

router.get('/settings', testimonialController.getSettings);
router.post("/settings", validate(settingsSchema), testimonialController.upsertSettings);

router.get("/analytics",validate(analyticsQuerySchema, "query"),testimonialController.getAnalytics);

router.post('/', validate(createTestimonialSchema), testimonialController.createTestimonial);
router.get("/",validate(testimonialQuerySchema, "query"),testimonialController.getTestimonials);

router.get('/:testimonialId', testimonialController.getTestimonialById);
router.put('/:testimonialId', validate(updateTestimonialSchema),testimonialController.updateTestimonial);
router.patch('/:testimonialId/status', validate(updateStatusSchema), testimonialController.updateStatus);
router.post('/:testimonialId/share', validate(shareSchema), testimonialController.shareTestimonial);
router.delete('/:testimonialId', testimonialController.deleteTestimonial);

module.exports = router;