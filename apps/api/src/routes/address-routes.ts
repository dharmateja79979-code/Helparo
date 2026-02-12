import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { createAddressForUser, listAddressesForUser } from "../repositories/address-repository.js";
import { createAddressSchema } from "../schemas/address-schemas.js";

export const addressRoutes: FastifyPluginAsync = async (app) => {
  app.get("/addresses", async (request, reply) => {
    await app.requireAuth(request);
    const rows = await listAddressesForUser(request.authUser!.id);
    reply.send(ok(rows));
  });

  app.post("/addresses", async (request, reply) => {
    await app.requireAuth(request);
    const body = createAddressSchema.parse(request.body);
    const row = await createAddressForUser({
      userId: request.authUser!.id,
      label: body.label,
      line1: body.line1,
      line2: body.line2,
      landmark: body.landmark,
      lat: body.lat,
      lng: body.lng,
      zoneId: body.zoneId
    });
    reply.status(201).send(ok(row));
  });
};
