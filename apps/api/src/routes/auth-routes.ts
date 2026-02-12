import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import { getUserProfile, updateUserRoleAndProfile } from "../repositories/user-repository.js";
import { authBootstrapSchema } from "../schemas/auth-schemas.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/auth/me", async (request, reply) => {
    await app.requireAuth(request);
    const profile = await getUserProfile(request.authUser!.id);
    reply.send(ok(profile));
  });

  app.post("/auth/bootstrap", async (request, reply) => {
    await app.requireAuth(request);
    const body = authBootstrapSchema.parse(request.body);
    const user = await updateUserRoleAndProfile({
      userId: request.authUser!.id,
      role: body.role,
      name: body.name
    });
    await insertAuditLog({
      actorId: request.authUser!.id,
      action: "auth.bootstrap",
      entityType: "user",
      entityId: request.authUser!.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: body
    });
    reply.send(ok(user));
  });
};
