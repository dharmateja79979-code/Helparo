import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { listActiveCategories, listActiveZones } from "../repositories/catalog-repository.js";

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/categories", async (_request, reply) => {
    const categories = await listActiveCategories();
    reply.send(ok(categories));
  });

  app.get("/zones", async (_request, reply) => {
    const zones = await listActiveZones();
    reply.send(ok(zones));
  });
};
