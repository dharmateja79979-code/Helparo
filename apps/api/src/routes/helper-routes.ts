import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import { helperLocationSchema, helperProfileUpdateSchema, helperQuerySchema } from "../schemas/helper-schemas.js";
import {
  discoverHelpers,
  getHelperEarnings,
  getHelperBookings,
  getHelperMe,
  saveHelperLocationPing,
  updateHelperMe
} from "../services/helper-service.js";

export const helperRoutes: FastifyPluginAsync = async (app) => {
  app.get("/helpers", async (request, reply) => {
    await app.requireAuth(request);
    const query = helperQuerySchema.parse(request.query);
    const helpers = await discoverHelpers(query);
    reply.send(ok(helpers));
  });

  app.get("/helper/me", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const profile = await getHelperMe(request.authUser!.id);
    reply.send(ok(profile));
  });

  app.post("/helper/me", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const body = helperProfileUpdateSchema.parse(request.body);
    const profile = await updateHelperMe(request.authUser!.id, body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "helper.profile.updated",
      entityType: "helper_profile",
      entityId: request.authUser!.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(profile));
  });

  app.get("/helper/bookings", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const bookings = await getHelperBookings(request.authUser!.id);
    reply.send(ok(bookings));
  });

  app.post("/helper/location", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const body = helperLocationSchema.parse(request.body);
    await saveHelperLocationPing({
      helperId: request.authUser!.id,
      bookingId: body.bookingId,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp
    });
    reply.send(ok({ stored: true }));
  });

  app.get("/helper/earnings", async (request, reply) => {
    await app.requireRole(request, ["helper"]);
    const earnings = await getHelperEarnings(request.authUser!.id);
    reply.send(ok(earnings));
  });
};
