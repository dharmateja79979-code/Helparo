import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(1).max(60),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional(),
  landmark: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  zoneId: z.string().uuid().optional()
});
