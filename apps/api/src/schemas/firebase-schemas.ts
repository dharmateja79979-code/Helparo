import { z } from "zod";

export const firebaseExchangeSchema = z.object({
  firebaseIdToken: z.string().min(16),
  role: z.enum(["customer", "helper"]),
  name: z.string().min(1).max(120).optional()
});
