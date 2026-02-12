import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import {
  bookingMediaSchema,
  bookingMessageSchema,
  bookingPaymentSchema,
  bookingReviewSchema,
  bookingStatusSchema,
  createBookingSchema
} from "../schemas/booking-schemas.js";
import {
  acceptBookingFlow,
  addMessageFlow,
  addReviewFlow,
  cancelBookingFlow,
  createBookingFlow,
  createMediaUploadFlow,
  getMediaReadUrlFlow,
  declineBookingFlow,
  getBookingDetails,
  getBookingTimeline,
  listMyBookings,
  recordPaymentFlow,
  updateBookingStatusFlow
} from "../services/booking-service.js";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });
const mediaParamsSchema = z.object({ id: z.string().uuid(), mediaId: z.string().uuid() });

export const bookingRoutes: FastifyPluginAsync = async (app) => {
  app.post("/bookings", { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } }, async (request, reply) => {
    await app.requireRole(request, ["customer"]);
    const body = createBookingSchema.parse(request.body);
    const booking = await createBookingFlow({
      customerId: request.authUser!.id,
      categoryId: body.categoryId,
      addressId: body.addressId,
      scheduledAt: body.scheduledAt,
      notes: body.notes,
      priceEstimateMin: body.priceEstimateMin,
      priceEstimateMax: body.priceEstimateMax
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.created",
      entityType: "booking",
      entityId: booking.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.status(201).send(ok(booking));
  });

  app.get("/bookings", async (request, reply) => {
    await app.requireAuth(request);
    const bookings = await listMyBookings(request.authUser!.id);
    reply.send(ok(bookings));
  });

  app.get("/bookings/:id", async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const booking = await getBookingDetails(params.id, request.authUser!.id);
    reply.send(ok(booking));
  });

  app.get("/bookings/:id/timeline", async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const timeline = await getBookingTimeline(params.id, request.authUser!.id);
    reply.send(ok(timeline));
  });

  app.post("/bookings/:id/cancel", async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const booking = await cancelBookingFlow(params.id, request.authUser!.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.cancelled",
      entityType: "booking",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.send(ok(booking));
  });

  app.post("/bookings/:id/review", async (request, reply) => {
    await app.requireRole(request, ["customer"]);
    const params = paramsSchema.parse(request.params);
    const body = bookingReviewSchema.parse(request.body);
    const review = await addReviewFlow({
      bookingId: params.id,
      customerId: request.authUser!.id,
      rating: body.rating,
      comment: body.comment
    });
    reply.status(201).send(ok(review));
  });

  app.post("/bookings/:id/message", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const body = bookingMessageSchema.parse(request.body);
    const message = await addMessageFlow(params.id, request.authUser!.id, body.body);
    reply.status(201).send(ok(message));
  });

  app.post("/bookings/:id/media", async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const body = bookingMediaSchema.parse(request.body);
    const mediaUpload = await createMediaUploadFlow({
      bookingId: params.id,
      uploaderId: request.authUser!.id,
      type: body.type,
      fileName: body.fileName
    });
    reply.status(201).send(ok(mediaUpload));
  });

  app.get("/bookings/:id/media/:mediaId/url", async (request, reply) => {
    await app.requireAuth(request);
    const params = mediaParamsSchema.parse(request.params);
    const signed = await getMediaReadUrlFlow({
      bookingId: params.id,
      mediaId: params.mediaId,
      actorId: request.authUser!.id
    });
    reply.send(ok(signed));
  });

  app.post("/bookings/:id/payment", async (request, reply) => {
    await app.requireAuth(request);
    const params = paramsSchema.parse(request.params);
    const body = bookingPaymentSchema.parse(request.body);
    const payment = await recordPaymentFlow({
      bookingId: params.id,
      actorId: request.authUser!.id,
      method: body.method,
      amount: body.amount,
      providerRef: body.providerRef,
      metadata: body.metadata
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.payment.recorded",
      entityType: "booking",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: { method: body.method, amount: body.amount }
    });
    reply.status(201).send(ok(payment));
  });

  app.post("/bookings/:id/accept", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const params = paramsSchema.parse(request.params);
    const booking = await acceptBookingFlow(params.id, request.authUser!.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.accepted",
      entityType: "booking",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.send(ok(booking));
  });

  app.post("/bookings/:id/decline", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const params = paramsSchema.parse(request.params);
    const result = await declineBookingFlow(params.id, request.authUser!.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.declined",
      entityType: "booking",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    });
    reply.send(ok(result));
  });

  app.post("/bookings/:id/status", async (request, reply) => {
    await app.requireRole(request, ["helper", "customer"]);
    const params = paramsSchema.parse(request.params);
    const body = bookingStatusSchema.parse(request.body);
    if (request.authUser!.role === "customer" && body.status !== "paid") {
      reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Customers can only mark payment status"
        }
      });
      return;
    }
    const booking = await updateBookingStatusFlow(
      params.id,
      request.authUser!.id,
      body.status,
      body.metadata
    );
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "booking.status.updated",
      entityType: "booking",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: { status: body.status }
    });
    reply.send(ok(booking));
  });
};
