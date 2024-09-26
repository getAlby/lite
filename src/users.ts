import { Hono } from "hono";
import { DOMAIN } from "./constants.ts";
import { createUser } from "./db/db.ts";
import { logger } from "./logger.ts";
import { nwcPool } from "./nwc/nwcPool.ts";

export const usersApp = new Hono();

usersApp.post("/", async (c) => {
  logger.debug("create user", {});

  const createUserRequest: { connectionSecret: string; username?: string } =
    await c.req.json();

  if (!createUserRequest.connectionSecret) {
    return c.text("no connection secret provided", 400);
  }

  const user = await createUser(
    createUserRequest.connectionSecret,
    createUserRequest.username
  );

  const lightningAddress = user.username + "@" + DOMAIN;

  nwcPool.addNWCClient(createUserRequest.connectionSecret, user.username);

  return c.json({
    lightningAddress,
  });
});
