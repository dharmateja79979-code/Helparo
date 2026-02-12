import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const pagingSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});
