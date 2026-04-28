const { z } = require('zod');

const reelIdParamSchema = z.object({
  id: z.string().uuid('Invalid reel ID')
});

const restaurantIdParamSchema = z.object({
  id: z.string().uuid('Invalid restaurant ID')
});

const commentIdParamSchema = z.object({
  id: z.string().uuid('Invalid reel ID'),
  commentId: z.string().uuid('Invalid comment ID')
});

const createCommentSchema = z.object({
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be at most 500 characters')
    .trim()
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20')
});

module.exports = {
  reelIdParamSchema,
  restaurantIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
  paginationSchema
};