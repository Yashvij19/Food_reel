const { z } = require('zod');

const createReelSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  foodItemId: z.string().uuid('Invalid food item ID').optional().nullable(),
  videoUrl: z.string().url('Invalid video URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
  caption: z.string().max(500, 'Caption must be at most 500 characters').optional().nullable(),
  durationMs: z.number().int().min(0).optional().default(0)
});

const reelIdParamSchema = z.object({
  id: z.string().uuid('Invalid reel ID')
});

const viewReelSchema = z.object({
  watchMs: z.number().int().min(0, 'Watch time must be positive')
});

const feedQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  cursor: z.string().uuid().optional()
});

module.exports = {
  createReelSchema,
  reelIdParamSchema,
  viewReelSchema,
  feedQuerySchema
};