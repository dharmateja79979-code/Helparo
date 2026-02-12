import { z } from "zod";

export const authBootstrapSchema = z.object({
  role: z.enum(["customer", "helper"]),
  name: z.string().min(1).max(120).optional()
});
