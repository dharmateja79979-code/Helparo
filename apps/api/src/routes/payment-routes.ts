import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ok } from "../lib/api-response.js";
import { AppError } from "../lib/errors.js";
import { cashfreeOrderSchema } from "../schemas/booking-schemas.js";
import {
  createCashfreeOrder,
  handleCashfreeWebhook,
  verifyCashfreeWebhookSignature
} from "../services/cashfree-service.js";

const bookingParamsSchema = z.object({ id: z.string().uuid() });

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/bookings/:id/payment/cashfree/order", async (request, reply) => {
    await app.requireRole(request, ["customer"]);
    const params = bookingParamsSchema.parse(request.params);
    const body = cashfreeOrderSchema.parse(request.body);
    const order = await createCashfreeOrder({
      bookingId: params.id,
      actorId: request.authUser!.id,
      amount: body.amount,
      customerPhone: request.authUser?.phone ?? null,
      customerEmail: request.authUser?.email ?? null
    });
    reply.status(201).send(ok(order));
  });

  app.post("/payments/cashfree/webhook", async (request, reply) => {
    const signature = request.headers["x-webhook-signature"]?.toString();
    const rawPayload = JSON.stringify(request.body ?? {});
    if (!verifyCashfreeWebhookSignature(rawPayload, signature)) {
      throw new AppError("WEBHOOK_UNAUTHORIZED", "Invalid webhook signature", 401);
    }
    const result = await handleCashfreeWebhook(request.body);
    reply.send(ok(result));
  });
};
