import { Hono } from "hono";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

export function createNostrWellKnownApp(db: DB) {
  const hono = new Hono();

  hono.get("/", async (c) => {
    try {
      const username = c.req.query("name");

      logger.debug("NIP05 request", { username });

      if (!username) {
        throw new Error("No username provided");
      }

      const user = await db.findUser(username);

      return c.json({
        names: {
          [username]: user.nostrPubkey
        }
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}
