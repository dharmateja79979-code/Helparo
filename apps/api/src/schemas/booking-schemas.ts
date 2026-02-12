import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createBookingSchema = z.object({
  categoryId: uuidSchema,
  addressId: uuidSchema,
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(1000).optional(),
  priceEstimateMin: z.number().min(0).optional(),
  priceEstimateMax: z.number().min(0).optional()
});

export const bookingMessageSchema = z.object({
  body: z.string().min(1).max(1000)
});

export const bookingReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  trustFlags: z.array(z.string()).optional()
});

export const bookingStatusSchema = z.object({
  status: z.enum(["enroute", "started", "completed", "paid"]),
  metadata: z.record(z.any()).optional()
});

export const bookingMediaSchema = z.object({
  type: z.enum(["before", "after", "issue"]),
  fileName: z.string().min(3).max(120),
  contentType: z.string().min(3).max(120)
});

export const bookingPaymentSchema = z.object({
  method: z.enum(["cash", "upi", "cashfree"]),
  amount: z.number().min(0),
  providerRef: z.string().max(120).optional(),
  metadata: z.record(z.any()).optional()
});

export const cashfreeOrderSchema = z.object({
  amount: z.number().positive()
});
