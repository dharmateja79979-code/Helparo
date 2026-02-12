import { z } from "zod";

export const helperModerationSchema = z.object({
  reason: z.string().max(500).optional()
});

export const commissionConfigSchema = z.object({
  defaultPercent: z.number().min(0).max(100)
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  iconKey: z.string().max(80).optional(),
  isActive: z.boolean().optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  iconKey: z.string().max(80).optional(),
  isActive: z.boolean().optional()
});

export const createZoneSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  country: z.string().min(2).max(120).default("India"),
  polygon: z.unknown().optional(),
  isActive: z.boolean().optional()
});

export const updateZoneSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(120).optional(),
  country: z.string().min(2).max(120).optional(),
  polygon: z.unknown().optional(),
  isActive: z.boolean().optional()
});

export const createSubscriptionPlanSchema = z.object({
  code: z.string().min(2).max(60),
  name: z.string().min(2).max(120),
  monthlyPrice: z.number().min(0),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().optional()
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  monthlyPrice: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});
