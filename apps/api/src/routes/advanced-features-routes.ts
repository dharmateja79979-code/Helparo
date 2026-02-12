import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ok } from "../lib/api-response.js";
import { NotFoundError } from "../lib/errors.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import {
  createAiEstimate,
  createCorporateAccount,
  createCorporateBooking,
  createDispute,
  createUserSubscription,
  getActiveSubscription,
  getPlanByCode,
  listCorporateBookingsForUser,
  listDisputes,
  resolveDispute
} from "../repositories/advanced-features-repository.js";
import {
  createAiEstimateSchema,
  createCorporateAccountSchema,
  createCorporateBookingSchema,
  createDisputeSchema,
  resolveDisputeSchema,
  subscribePlanSchema
} from "../schemas/advanced-features-schemas.js";

const bookingParams = z.object({ id: z.string().uuid() });
const disputeParams = z.object({ id: z.string().uuid() });

export const advancedFeatureRoutes: FastifyPluginAsync = async (app) => {
  app.post("/bookings/:id/dispute", async (request, reply) => {
    await app.requireAuth(request);
    const params = bookingParams.parse(request.params);
    const body = createDisputeSchema.parse(request.body);
    const dispute = await createDispute({
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
    const rows = await listDisputes();
    reply.send(ok(rows));
  });

  app.post("/admin/disputes/:id/resolve", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = disputeParams.parse(request.params);
    const body = resolveDisputeSchema.parse(request.body);
    const row = await resolveDispute({
      disputeId: params.id,
      status: body.status,
      resolutionNote: body.resolutionNote,
      resolvedBy: request.authUser!.id
    });
    if (!row) throw new NotFoundError("Dispute not found");
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
    const plan = await getPlanByCode(body.planCode);
    if (!plan) throw new NotFoundError("Plan not found");
    const sub = await createUserSubscription({
      userId: request.authUser!.id,
      planId: plan.id,
      providerRef: body.providerRef
    });
    reply.status(201).send(ok(sub));
  });

  app.get("/premium/me", async (request, reply) => {
    await app.requireAuth(request);
    const row = await getActiveSubscription(request.authUser!.id);
    reply.send(ok(row));
  });

  app.post("/corporate/accounts", async (request, reply) => {
    await app.requireAuth(request);
    const body = createCorporateAccountSchema.parse(request.body);
    const account = await createCorporateAccount({
      name: body.name,
      city: body.city,
      createdBy: request.authUser!.id
    });
    reply.status(201).send(ok(account));
  });

  app.post("/corporate/bookings", async (request, reply) => {
    await app.requireAuth(request);
    const body = createCorporateBookingSchema.parse(request.body);
    const row = await createCorporateBooking({
      corporateId: body.corporateId,
      bookingId: body.bookingId,
      requestedBy: request.authUser!.id,
      costCenter: body.costCenter
    });
    reply.status(201).send(ok(row));
  });

  app.get("/corporate/bookings", async (request, reply) => {
    await app.requireAuth(request);
    const rows = await listCorporateBookingsForUser(request.authUser!.id);
    reply.send(ok(rows));
  });

  app.post("/ai/estimate", async (request, reply) => {
    await app.requireAuth(request);
    const body = createAiEstimateSchema.parse(request.body);
    const row = await createAiEstimate({
      bookingId: body.bookingId,
      requestedBy: request.authUser!.id,
      inputMedia: body.inputMedia,
      prompt: body.prompt
    });
    reply.status(201).send(ok(row));
  });
};
