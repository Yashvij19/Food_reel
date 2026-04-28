const { z } = require('zod');

const orderItemSchema = z.object({
  foodItemId: z.string().uuid('Invalid food item ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity must be at most 99')
});

const createOrderSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  deliveryAddress: z.string().min(10, 'Please provide a valid delivery address'),
  reelId: z.string().uuid('Invalid reel ID').optional().nullable(),
  notes: z.string().max(500).optional().nullable()
});

const orderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID')
});

const updateAddressSchema = z.object({
  deliveryAddress: z.string().min(10, 'Please provide a valid delivery address')
});

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10')
});

module.exports = {
  createOrderSchema,
  orderIdParamSchema,
  updateAddressSchema,
  updateStatusSchema,
  paginationSchema
};