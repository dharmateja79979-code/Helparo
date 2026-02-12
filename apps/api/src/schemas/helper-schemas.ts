import { z } from "zod";
import { uuidSchema } from "./common.js";

export const helperQuerySchema = z.object({
  categoryId: uuidSchema,
  zoneId: uuidSchema.optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional()
});

export const helperProfileUpdateSchema = z.object({
  bio: z.string().max(1500).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  services: z.array(uuidSchema).min(1).optional(),
  basePrice: z.number().min(0).optional(),
  serviceAreas: z.array(uuidSchema).min(1).optional()
});

export const helperLocationSchema = z.object({
  bookingId: uuidSchema,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string().datetime()
});
