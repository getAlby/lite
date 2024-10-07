import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { secureHeaders } from "hono/secure-headers";
//import { sentry } from "npm:@hono/sentry";
import { PORT } from "./constants.ts";
import { DB, runMigration } from "./db/db.ts";
import { createLnurlApp } from "./lnurlp.ts";
import { LOG_LEVEL, logger, loggerMiddleware } from "./logger.ts";
import { NWCPool } from "./nwc/nwcPool.ts";
import { createUsersApp } from "./users.ts";

await runMigration();

const db = new DB();
const nwcPool = new NWCPool(db);
await nwcPool.init();

// TODO: re-enable sentry
//const SENTRY_DSN = Deno.env.get("SENTRY_DSN");

const hono = new Hono();

hono.use(loggerMiddleware());
hono.use(secureHeaders());
/*if (SENTRY_DSN) {
  hono.use("*", sentry({ dsn: SENTRY_DSN }));
}*/

hono.route("/.well-known/lnurlp", createLnurlApp(db));
hono.route("/users", createUsersApp(db, nwcPool));

hono.get("/ping", (c) => {
  return c.body("OK");
});

hono.use("/favicon.ico", serveStatic({ path: "./favicon.ico" }));

hono.get("/robots.txt", (c) => {
  return c.body("User-agent: *\nDisallow: /", 200);
});

Deno.serve({ port: PORT }, hono.fetch);

logger.info("Server started", { port: PORT, log_level: LOG_LEVEL });
