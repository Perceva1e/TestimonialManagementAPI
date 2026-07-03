const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/settings', testimonialController.getSettings);
router.post('/settings', testimonialController.upsertSettings);

router.get('/analytics', testimonialController.getAnalytics);

router.post('/', testimonialController.createTestimonial);
router.get('/', testimonialController.getTestimonials);

router.get('/:testimonialId', testimonialController.getTestimonialById);
router.put('/:testimonialId', testimonialController.updateTestimonial);
router.patch('/:testimonialId/status', testimonialController.updateStatus);
router.post('/:testimonialId/share', testimonialController.shareTestimonial);
router.delete('/:testimonialId', testimonialController.deleteTestimonial);

module.exports = router;