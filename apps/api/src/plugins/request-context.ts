import { randomUUID } from "crypto";
import type { FastifyPluginAsync } from "fastify";

export const requestContextPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    const requestId = request.headers["x-request-id"]?.toString() ?? randomUUID();
    request.requestId = requestId;
    reply.header("x-request-id", requestId);
  });
};
