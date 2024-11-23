import { Context, Hono } from "hono";
import { nwc } from "npm:@getalby/sdk";
import { logger } from "../src/logger.ts";
import { BASE_URL, DOMAIN } from "./constants.ts";
import { DB } from "./db/db.ts";
import "./nwc/nwcPool.ts";

export function createLnurlWellKnownApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username", async (c: Context) => {
    try {
      const username = c.req.param("username");

      logger.debug("LNURLp request", { username });

      // check the user exists
      await db.findWalletConnectionSecret(username);

      // TODO: zapper support

      return c.json({
        tag: "payRequest",
        commentAllowed: 255,
        callback: `${BASE_URL}/lnurlp/${username}/callback`,
        minSendable: 1000,
        maxSendable: 10000000000,
        metadata: `[["text/identifier","${username}@${DOMAIN}"],["text/plain","Sats for ${username}"]]`,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}

export function createLnurlApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username/callback", async (c: Context) => {
    try {
      const username = c.req.param("username");
      const amount = c.req.query("amount");
      const comment = c.req.query("comment") || "";
      logger.debug("LNURLp callback", { username, amount, comment });

      // TODO: store data (e.g. for zaps)

      if (!amount) {
        throw new Error("No amount provided");
      }

      const connectionSecret = await db.findWalletConnectionSecret(username);

      const nwcClient = new nwc.NWCClient({
        nostrWalletConnectUrl: connectionSecret,
      });

      const transaction = await nwcClient.makeInvoice({
        amount: Math.floor(+amount / 1000) * 1000,
        description: comment,
      });

      return c.json({
        verify: `${BASE_URL}/lnurlp/${username}/verify/${transaction.payment_hash}`,
        routes: [],
        pr: transaction.invoice,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  hono.get("/:username/verify/:payment_hash", async (c: Context) => {
    try {
      const username = c.req.param("username");
      const paymentHash = c.req.param("payment_hash");
      logger.debug("LNURLp verify", { username, paymentHash });

      const connectionSecret = await db.findWalletConnectionSecret(username);

      const nwcClient = new nwc.NWCClient({
        nostrWalletConnectUrl: connectionSecret,
      });

      const transaction = await nwcClient.lookupInvoice({
        payment_hash: paymentHash,
      });

      return c.json({
        settled: !!transaction.settled_at,
        preimage: transaction.preimage || null,
        pr: transaction.invoice,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}
