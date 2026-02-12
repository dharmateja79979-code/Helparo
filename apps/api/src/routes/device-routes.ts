import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { registerUserDevice } from "../repositories/device-repository.js";
import { registerDeviceSchema } from "../schemas/device-schemas.js";

export const deviceRoutes: FastifyPluginAsync = async (app) => {
  app.post("/devices/register", async (request, reply) => {
    await app.requireAuth(request);
    const body = registerDeviceSchema.parse(request.body);
    const device = await registerUserDevice(request.authUser!.id, body.platform, body.fcmToken);
    reply.status(201).send(ok(device));
  });
};
