const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', testimonialController.createTestimonial);
router.get('/', testimonialController.getTestimonials);

router.put('/:testimonialId', testimonialController.updateTestimonial);
router.delete('/:testimonialId', testimonialController.deleteTestimonial);

module.exports = router;