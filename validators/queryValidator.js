const Joi = require('joi');

const testimonialQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string().valid(
    'draft',
    'recording',
    'processing',
    'completed',
    'shared',
  ),

  sort: Joi.string()
    .valid('createdAt', 'updatedAt', 'rating')
    .default('createdAt'),
}).unknown(false);

const analyticsQuerySchema = Joi.object({
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
});

module.exports = {
  testimonialQuerySchema,
  analyticsQuerySchema,
};
