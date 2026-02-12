import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";
import { fail } from "../lib/api-response.js";
import { AppError } from "../lib/errors.js";

export const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.requestId }, "request failed");

    if (error instanceof AppError) {
      reply.status(error.statusCode).send(fail(error.code, error.message, error.details));
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(fail("VALIDATION_ERROR", "Invalid request payload", error.flatten()));
      return;
    }

    reply.status(500).send(fail("INTERNAL_ERROR", "Unexpected server error"));
  });
};
