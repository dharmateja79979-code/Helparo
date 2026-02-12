import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import {
  commissionConfigSchema,
  createCategorySchema,
  createSubscriptionPlanSchema,
  createZoneSchema,
  helperModerationSchema,
  updateCategorySchema,
  updateSubscriptionPlanSchema,
  updateZoneSchema
} from "../schemas/admin-schemas.js";
import {
  approveHelper,
  createCategoryForAdmin,
  createSubscriptionPlanForAdmin,
  createZoneForAdmin,
  getCommissionConfigForAdmin,
  listCategoriesForAdmin,
  listAuditLogsForAdmin,
  listSubscriptionPlansForAdmin,
  listZonesForAdmin,
  rejectHelper,
  suspendHelperByAdmin,
  updateCategoryForAdmin,
  updateCommissionConfigForAdmin,
  updateSubscriptionPlanForAdmin,
  updateZoneForAdmin
} from "../services/admin-service.js";

const helperParamsSchema = z.object({ id: z.string().uuid() });
const entityParamsSchema = z.object({ id: z.string().uuid() });

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post("/admin/helpers/:id/approve", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = helperParamsSchema.parse(request.params);
    const body = helperModerationSchema.parse(request.body ?? {});
    const helper = await approveHelper(params.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "helper.approved",
      entityType: "helper_profile",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(helper));
  });

  app.post("/admin/helpers/:id/reject", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = helperParamsSchema.parse(request.params);
    const body = helperModerationSchema.parse(request.body ?? {});
    const helper = await rejectHelper(params.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "helper.rejected",
      entityType: "helper_profile",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(helper));
  });

  app.post("/admin/helpers/:id/suspend", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = helperParamsSchema.parse(request.params);
    const body = helperModerationSchema.parse(request.body ?? {});
    const helper = await suspendHelperByAdmin(params.id);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "helper.suspended",
      entityType: "helper_profile",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(helper));
  });

  app.get("/admin/audit-logs", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const rows = await listAuditLogsForAdmin(200);
    reply.send(ok(rows));
  });

  app.get("/admin/config/commission", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const config = await getCommissionConfigForAdmin();
    reply.send(ok(config));
  });

  app.post("/admin/config/commission", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const body = commissionConfigSchema.parse(request.body);
    const config = await updateCommissionConfigForAdmin(body.defaultPercent);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.commission.updated",
      entityType: "app_settings",
      entityId: "commission",
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(config));
  });

  app.get("/admin/categories", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const rows = await listCategoriesForAdmin();
    reply.send(ok(rows));
  });

  app.post("/admin/categories", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const body = createCategorySchema.parse(request.body);
    const row = await createCategoryForAdmin(body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.category.created",
      entityType: "service_category",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.status(201).send(ok(row));
  });

  app.patch("/admin/categories/:id", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = entityParamsSchema.parse(request.params);
    const body = updateCategorySchema.parse(request.body);
    const row = await updateCategoryForAdmin(params.id, body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.category.updated",
      entityType: "service_category",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(row));
  });

  app.get("/admin/zones", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const rows = await listZonesForAdmin();
    reply.send(ok(rows));
  });

  app.post("/admin/zones", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const body = createZoneSchema.parse(request.body);
    const row = await createZoneForAdmin(body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.zone.created",
      entityType: "service_zone",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.status(201).send(ok(row));
  });

  app.patch("/admin/zones/:id", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = entityParamsSchema.parse(request.params);
    const body = updateZoneSchema.parse(request.body);
    const row = await updateZoneForAdmin(params.id, body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.zone.updated",
      entityType: "service_zone",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(row));
  });

  app.get("/admin/subscription-plans", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const rows = await listSubscriptionPlansForAdmin();
    reply.send(ok(rows));
  });

  app.post("/admin/subscription-plans", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const body = createSubscriptionPlanSchema.parse(request.body);
    const row = await createSubscriptionPlanForAdmin(body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.subscription_plan.created",
      entityType: "subscription_plan",
      entityId: row.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.status(201).send(ok(row));
  });

  app.patch("/admin/subscription-plans/:id", async (request, reply) => {
    await app.requireRole(request, ["admin"]);
    const params = entityParamsSchema.parse(request.params);
    const body = updateSubscriptionPlanSchema.parse(request.body);
    const row = await updateSubscriptionPlanForAdmin(params.id, body);
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "admin.subscription_plan.updated",
      entityType: "subscription_plan",
      entityId: params.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(row));
  });
};
