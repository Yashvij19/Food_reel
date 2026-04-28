const { z } = require('zod');

const restaurantIdParamSchema = z.object({
  id: z.string().uuid('Invalid restaurant ID')
});

const reelIdParamSchema = z.object({
  id: z.string().uuid('Invalid reel ID')
});

const periodQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d')
});

module.exports = {
  restaurantIdParamSchema,
  reelIdParamSchema,
  periodQuerySchema
};