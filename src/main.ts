import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { secureHeaders } from "hono/secure-headers";
import { loggerMiddleware, LOG_LEVEL, logger } from "./logger.ts";
import { sentry } from "npm:@hono/sentry";
import { lnurlApp } from "./lnurlp.ts";
import { PORT } from "./constants.ts";
import { usersApp } from "./users.ts";

const SENTRY_DSN = Deno.env.get("SENTRY_DSN");

const baseApp = new Hono();

baseApp.use(loggerMiddleware());
baseApp.use(secureHeaders());
if (SENTRY_DSN) {
  baseApp.use("*", sentry({ dsn: SENTRY_DSN }));
}

baseApp.route("/.well-known/lnurlp", lnurlApp);
baseApp.route("/users", usersApp);

baseApp.get("/ping", (c) => {
  return c.body("OK");
});

baseApp.use("/favicon.ico", serveStatic({ path: "./favicon.ico" }));

baseApp.get("/robots.txt", (c) => {
  return c.body("User-agent: *\nDisallow: /", 200);
});

Deno.serve({ port: PORT }, baseApp.fetch);

logger.info("Server started", { port: PORT, log_level: LOG_LEVEL });
