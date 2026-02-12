import { z } from "zod";

export const helperModerationSchema = z.object({
  reason: z.string().max(500).optional()
});

export const commissionConfigSchema = z.object({
  defaultPercent: z.number().min(0).max(100)
});
