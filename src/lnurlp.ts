import { Hono } from "hono";
import { nwc } from "npm:@getalby/sdk";
import { logger } from "../src/logger.ts";
import { BASE_URL, DOMAIN } from "./constants.ts";
import { DB } from "./db/db.ts";
import "./nwc/nwcPool.ts";

export function createLnurlApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username", (c) => {
    const username = c.req.param("username");

    logger.debug("LNURLp request", { username });

    // TODO: zapper support

    return c.json({
      status: "OK",
      tag: "payRequest",
      commentAllowed: 255,
      callback: `${BASE_URL}/.well-known/lnurlp/${username}/callback`,
      minSendable: 1000,
      maxSendable: 10000000000,
      metadata: `[["text/identifier","${username}@${DOMAIN}"],["text/plain","Sats for ${username}"]]`,
    });
  });

  hono.get("/:username/callback", async (c) => {
    const username = c.req.param("username");
    const amount = c.req.query("amount");
    const comment = c.req.query("comment") || "";
    logger.debug("LNURLp callback", { username, amount, comment });

    // TODO: store data (e.g. for zaps)

    if (!amount) {
      return c.text("No amount provided", 404);
    }

    const connectionSecret = await db.findWalletConnection(username);

    const nwcClient = new nwc.NWCClient({
      nostrWalletConnectUrl: connectionSecret,
    });

    const transaction = await nwcClient.makeInvoice({
      amount: +amount,
      description: comment,
    });

    return c.json({
      pr: transaction.invoice,
    });
  });
  return hono;
}
