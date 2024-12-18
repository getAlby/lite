import { Hono } from "hono";
import { BASE_URL, DOMAIN, NOSTR_NIP57_PUBLIC_KEY } from "../constants.ts";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

function getLnurlMetadata(username: string): string {
  return JSON.stringify([
    ["text/identifier", `${username}@${DOMAIN}`],
    ["text/plain", `Sats for ${username}`],
  ])
}

export function createLnurlWellKnownApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username", async (c) => {
    try {
      const username = c.req.param("username");

      logger.debug("LNURLp request", { username });

      // check the user exists
      await db.findUser(username);

      return c.json({
        tag: "payRequest",
        commentAllowed: 255,
        callback: `${BASE_URL}/lnurlp/${username}/callback`,
        minSendable: 1000,
        maxSendable: 10000000000,
        metadata: getLnurlMetadata(username),
        payerData: {
          name: {
            mandatory: false
          },
          email: {
            mandatory: false
          },
          pubkey: {
            mandatory: false
          }
        },
        ...(NOSTR_NIP57_PUBLIC_KEY ? {
          nostrPubkey: NOSTR_NIP57_PUBLIC_KEY,
          allowsNostr: true,
        } : {})
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}
