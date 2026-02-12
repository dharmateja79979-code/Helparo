import { env } from "./config/env.js";
import { buildServer } from "./server.js";

const app = buildServer();

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => app.log.info({ port: env.PORT }, "Helparo API started"))
  .catch((error) => {
    app.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  });
