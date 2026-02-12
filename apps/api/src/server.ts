import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { fail, ok } from "./lib/api-response.js";
import { adminRoutes } from "./routes/admin-routes.js";
import { bookingRoutes } from "./routes/booking-routes.js";
import { catalogRoutes } from "./routes/catalog-routes.js";
import { helperRoutes } from "./routes/helper-routes.js";
import { deviceRoutes } from "./routes/device-routes.js";
import { paymentRoutes } from "./routes/payment-routes.js";
import { authRoutes } from "./routes/auth-routes.js";
import { firebaseAuthRoutes } from "./routes/firebase-auth-routes.js";
import { addressRoutes } from "./routes/address-routes.js";
import { advancedFeatureRoutes } from "./routes/advanced-features-routes.js";
import { authPlugin } from "./plugins/auth.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { requestContextPlugin } from "./plugins/request-context.js";

export const buildServer = () => {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.register(cors, { origin: true });
  app.register(requestContextPlugin);
  app.register(authPlugin);
  app.register(rateLimitPlugin);
  app.register(errorHandlerPlugin);

  app.get("/health", async () => ok({ status: "ok" }));
  app.get("/metrics", async () => ok({ uptimeSec: Math.round(process.uptime()) }));
  app.get("/", async () =>
    ok({
      name: "Helparo API",
      version: "0.1.0",
      status: "ready"
    })
  );
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send(fail("NOT_FOUND", "Route not found"));
  });

  app.register(catalogRoutes);
  app.register(helperRoutes);
  app.register(bookingRoutes);
  app.register(deviceRoutes);
  app.register(paymentRoutes);
  app.register(authRoutes);
  app.register(firebaseAuthRoutes);
  app.register(addressRoutes);
  app.register(advancedFeatureRoutes);
  app.register(adminRoutes);

  return app;
};
