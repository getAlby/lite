import { nip19 } from "@nostr/tools";
import { Hono } from "hono";
import postgres from "postgres";
import { DOMAIN } from "./constants.ts";
import { DB } from "./db/db.ts";
import { logger } from "./logger.ts";
import { NWCPool } from "./nwc/nwcPool.ts";
import { isValid32ByteHex } from "./utils.ts";

export function createUsersApp(db: DB, nwcPool: NWCPool) {
  const hono = new Hono();

  // Authentication middleware function
  const checkApiKey = (c: any) => {
    const apiKey = c.req.header("X-API-Key");
    const expectedKey = Deno.env.get("API_KEY");
    
    if (!expectedKey) {
      logger.warn("API_KEY environment variable is not set, authorization denied.");
      return false;
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      logger.warn("Unauthorized API access attempt");
      return false;
    }
    
    return true;
  };

  hono.post("/", async (c) => {
    // Check authentication
    if (!checkApiKey(c)) {
      return c.json({ status: "ERROR", reason: "Unauthorized" }, 401);
    }

    try {
      logger.debug("create user", {});

      const createUserRequest: { connectionSecret: string; username?: string, nostrPubkey: string } =
        await c.req.json();

      if (!createUserRequest.connectionSecret) {
        return c.text("no connection secret provided", 400);
      }

      let nostrPubkey = createUserRequest.nostrPubkey
      if (!nostrPubkey) {
        return c.text("no nostr pubkey provided", 400);
      }

      if (nostrPubkey.startsWith("npub")) {
        nostrPubkey = nip19.decode(nostrPubkey).data as string
      }

      if (!isValid32ByteHex(nostrPubkey)) {
        return c.text("invalid nostr pubkey provided", 400);
      }

      const user = await db.createUser(
        createUserRequest.connectionSecret,
        createUserRequest.username,
        nostrPubkey
      );

      const lightningAddress = user.username + "@" + DOMAIN;

      nwcPool.subscribeUser(createUserRequest.connectionSecret, user.id);

      return c.json({
        lightningAddress,
      });
    } catch (error) {
      let reason = "" + error
      if (error instanceof postgres.PostgresError && error.constraint_name === "users_username_unique") {
        reason = "Username has already been taken"
      }
      return c.json({ status: "ERROR", reason });
    }
  });

  return hono;
}