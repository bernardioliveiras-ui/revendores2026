// Entrada alternativa para hospedagens que iniciam um arquivo Node em vez de npm start.
import { createServer } from "node:http";
import next from "next";
await import("./scripts/migrate.mjs");
if (!process.exitCode) {
  const port = Number(process.env.PORT || 3000);
  const app = next({ dev:false, port });
  await app.prepare();
  createServer(app.getRequestHandler()).listen(port, "0.0.0.0");
}
