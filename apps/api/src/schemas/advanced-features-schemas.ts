import { z } from "zod";

export const createDisputeSchema = z.object({
  reason: z.string().min(5).max(1000),
  evidence: z.array(z.string()).optional()
});

export const resolveDisputeSchema = z.object({
  status: z.enum(["resolved", "rejected", "investigating"]),
  resolutionNote: z.string().max(2000).optional()
});

export const subscribePlanSchema = z.object({
  planCode: z.string().min(2).max(40),
  providerRef: z.string().max(120).optional()
});

export const cancelPremiumSchema = z.object({
  reason: z.string().max(300).optional()
});

export const createCorporateAccountSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().max(80).optional()
});

export const createCorporateBookingSchema = z.object({
  corporateId: z.string().uuid(),
  bookingId: z.string().uuid(),
  costCenter: z.string().max(80).optional()
});

export const addCorporateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "manager", "member"]).default("member")
});

export const createAiEstimateSchema = z.object({
  bookingId: z.string().uuid().optional(),
  inputMedia: z.array(z.string()).min(1),
  prompt: z.string().max(1000).optional()
});

export const escrowActionSchema = z.object({
  action: z.enum(["hold", "release", "refund"]),
  note: z.string().max(500).optional()
});
