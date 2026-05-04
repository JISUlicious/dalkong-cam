import { config } from "./config.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ host: "0.0.0.0", port: config.PORT });
  } catch (err) {
    app.log.error({ err }, "failed to start");
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
