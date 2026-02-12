import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import { commissionConfigSchema, helperModerationSchema } from "../schemas/admin-schemas.js";
import {
  approveHelper,
  getCommissionConfigForAdmin,
  listAuditLogsForAdmin,
  rejectHelper,
  suspendHelperByAdmin,
  updateCommissionConfigForAdmin
} from "../services/admin-service.js";

const helperParamsSchema = z.object({ id: z.string().uuid() });

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
};
