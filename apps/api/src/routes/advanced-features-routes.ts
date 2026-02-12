import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import {
  addCorporateMemberSchema,
  cancelPremiumSchema,
  createAiEstimateSchema,
  createCorporateAccountSchema,
  createCorporateBookingSchema,
  createDisputeSchema,
  escrowActionSchema,
  resolveDisputeSchema,
  subscribePlanSchema
} from "../schemas/advanced-features-schemas.js";
import {
  addCorporateMemberFlow,
  cancelPremiumFlow,
  createAiEstimateFlow,
  createCorporateAccountFlow,
  createCorporateBookingFlow,
  getMySubscriptionFlow,
  listCorporateMembersFlow,
  listCorporateBookingsFlow,
  listDisputesFlow,
  raiseDisputeFlow,
  resolveDisputeFlow,
  setPaymentEscrowFlow,
  subscribePremiumFlow
} from "../services/advanced-feature-service.js";

const bookingParams = z.object({ id: z.string().uuid() });
const disputeParams = z.object({ id: z.string().uuid() });
const corporateParams = z.object({ id: z.string().uuid() });
const paymentParams = z.object({ id: z.string().uuid() });

export const advancedFeatureRoutes: FastifyPluginAsync = async (app) => {
  app.post("/bookings/:id/dispute", async (request, reply) => {
    await app.requireAuth(request);
    const params = bookingParams.parse(request.params);
    const body = createDisputeSchema.parse(request.body);
    const dispute = await raiseDisputeFlow({
      bookingId: params.id,
      raisedBy: request.authUser!.id,
      reason: body.reason,
      evidence: body.evidence
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "dispute.created",
      entityType: "dispute",
      entityId: dispute.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.status(201).send(ok(dispute));
  });

  app.get("/admin/disputes", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const rows = await listDisputesFlow();
    reply.send(ok(rows));
  });

  app.post("/admin/disputes/:id/resolve", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = disputeParams.parse(request.params);
    const body = resolveDisputeSchema.parse(request.body);
    const row = await resolveDisputeFlow({
      disputeId: params.id,
      status: body.status,
      resolutionNote: body.resolutionNote,
      resolvedBy: request.authUser!.id
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "dispute.resolved",
      entityType: "dispute",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(row));
  });

  app.post("/premium/subscribe", async (request, reply) => {
    await app.requireAuth(request);
    const body = subscribePlanSchema.parse(request.body);
    const sub = await subscribePremiumFlow({
      userId: request.authUser!.id,
      planCode: body.planCode,
      providerRef: body.providerRef
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "premium.subscribed",
      entityType: "subscription",
      entityId: sub.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: { planCode: body.planCode }
    });
    reply.status(201).send(ok(sub));
  });

  app.get("/premium/me", async (request, reply) => {
    await app.requireAuth(request);
    const row = await getMySubscriptionFlow(request.authUser!.id);
    reply.send(ok(row));
  });

  app.post("/premium/cancel", async (request, reply) => {
    await app.requireAuth(request);
    const body = cancelPremiumSchema.parse(request.body ?? {});
    const result = await cancelPremiumFlow({
      userId: request.authUser!.id,
      reason: body.reason
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "premium.cancelled",
      entityType: "subscription",
      entityId: request.authUser!.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(result));
  });

  app.post("/corporate/accounts", async (request, reply) => {
    await app.requireAuth(request);
    const body = createCorporateAccountSchema.parse(request.body);
    const account = await createCorporateAccountFlow({
      name: body.name,
      city: body.city,
      createdBy: request.authUser!.id
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "corporate.account.created",
      entityType: "corporate_account",
      entityId: account.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.status(201).send(ok(account));
  });

  app.post("/corporate/bookings", async (request, reply) => {
    await app.requireAuth(request);
    const body = createCorporateBookingSchema.parse(request.body);
    const row = await createCorporateBookingFlow({
      corporateId: body.corporateId,
      bookingId: body.bookingId,
      requestedBy: request.authUser!.id,
      costCenter: body.costCenter
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "corporate.booking.mapped",
      entityType: "corporate_booking",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.status(201).send(ok(row));
  });

  app.get("/corporate/bookings", async (request, reply) => {
    await app.requireAuth(request);
    const rows = await listCorporateBookingsFlow(request.authUser!.id);
    reply.send(ok(rows));
  });

  app.get("/corporate/accounts/:id/members", async (request, reply) => {
    await app.requireAuth(request);
    const params = corporateParams.parse(request.params);
    const rows = await listCorporateMembersFlow({
      corporateId: params.id,
      actorId: request.authUser!.id
    });
    reply.send(ok(rows));
  });

  app.post("/corporate/accounts/:id/members", async (request, reply) => {
    await app.requireAuth(request);
    const params = corporateParams.parse(request.params);
    const body = addCorporateMemberSchema.parse(request.body);
    const row = await addCorporateMemberFlow({
      corporateId: params.id,
      actorId: request.authUser!.id,
      userId: body.userId,
      role: body.role
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "corporate.member.upserted",
      entityType: "corporate_member",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: { corporateId: params.id, userId: body.userId, role: body.role }
    });
    reply.status(201).send(ok(row));
  });

  app.post("/ai/estimate", async (request, reply) => {
    await app.requireAuth(request);
    const body = createAiEstimateSchema.parse(request.body);
    const row = await createAiEstimateFlow({
      bookingId: body.bookingId,
      requestedBy: request.authUser!.id,
      inputMedia: body.inputMedia,
      prompt: body.prompt
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "ai.estimate.created",
      entityType: "ai_issue_estimate",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.status(201).send(ok(row));
  });

  app.post("/admin/payments/:id/escrow", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = paymentParams.parse(request.params);
    const body = escrowActionSchema.parse(request.body);
    const row = await setPaymentEscrowFlow({
      paymentId: params.id,
      action: body.action,
      note: body.note
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: `payment.escrow.${body.action}`,
      entityType: "payment",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(row));
  });
};
