import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";

export const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.authUser?.id ?? request.ip
  });
};
