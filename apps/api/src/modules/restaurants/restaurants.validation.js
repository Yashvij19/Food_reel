const { z } = require('zod');

const createRestaurantSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim(),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().max(100).optional().nullable(),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
  category: z.enum([
    'indian', 'chinese', 'italian', 'mexican', 'japanese',
    'thai', 'american', 'fast_food', 'cafe', 'bakery',
    'desserts', 'beverages', 'healthy', 'other'
  ]).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable()
});

const updateRestaurantSchema = createRestaurantSchema.partial();

const restaurantIdParamSchema = z.object({
  id: z.string().uuid('Invalid restaurant ID')
});

const createFoodItemSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().max(100).optional().nullable(),
  isVeg: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().default(true)
});

const updateFoodItemSchema = createFoodItemSchema.partial();

const foodItemIdParamSchema = z.object({
  id: z.string().uuid('Invalid restaurant ID'),
  itemId: z.string().uuid('Invalid food item ID')
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10')
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10')
});

module.exports = {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantIdParamSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  foodItemIdParamSchema,
  paginationSchema,
  searchQuerySchema
};