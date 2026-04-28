const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable()
});

const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullAddress: z.string().min(1, 'Address is required'),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().default(false)
});

const updateAddressSchema = createAddressSchema.partial();

const addressIdParamSchema = z.object({
  id: z.string().uuid('Invalid address ID')
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10')
});

module.exports = {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  paginationSchema
};