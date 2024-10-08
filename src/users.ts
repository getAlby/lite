import { Hono } from "hono";
import { DOMAIN } from "./constants.ts";
import { DB } from "./db/db.ts";
import { logger } from "./logger.ts";
import { NWCPool } from "./nwc/nwcPool.ts";

export function createUsersApp(db: DB, nwcPool: NWCPool) {
  const hono = new Hono();

  hono.post("/", async (c) => {
    logger.debug("create user", {});

    const createUserRequest: { connectionSecret: string; username?: string } =
      await c.req.json();

    if (!createUserRequest.connectionSecret) {
      return c.text("no connection secret provided", 400);
    }

    const user = await db.createUser(
      createUserRequest.connectionSecret,
      createUserRequest.username
    );

    const lightningAddress = user.username + "@" + DOMAIN;

    nwcPool.subscribeUser(createUserRequest.connectionSecret, user.username);

    return c.json({
      lightningAddress,
    });
  });
  return hono;
}
