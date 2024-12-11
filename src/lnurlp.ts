import { Event } from "@nostr/tools";
import { validateZapRequest } from "@nostr/tools/nip57";
import { Hono } from "hono";
import { nwc } from "npm:@getalby/sdk";
import { logger } from "../src/logger.ts";
import { BASE_URL, DOMAIN } from "./constants.ts";
import { DB } from "./db/db.ts";
import "./nwc/nwcPool.ts";

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

      // TODO: zapper support

      return c.json({
        tag: "payRequest",
        commentAllowed: 255,
        callback: `${BASE_URL}/lnurlp/${username}/callback`,
        minSendable: 1000,
        maxSendable: 10000000000,
        metadata: getLnurlMetadata(username),
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}

export function createLnurlApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username/callback", async (c) => {
    try {
      const username = c.req.param("username");
      const amount = c.req.query("amount");
      const comment = c.req.query("comment") || "";
      const payerData = c.req.query("payerdata") ? JSON.parse(c.req.query("payerdata") || "") : null;
      const nostr = c.req.query("nostr") ? decodeURIComponent(c.req.query("nostr") || "") : null;

      logger.debug("LNURLp callback", { username, amount, comment, payer_data: payerData, nostr });

      if (!amount) {
        throw new Error("No amount provided");
      }

      let zapRequest: Event | undefined
      if (nostr) {
        const zapValidationError = validateZapRequest(nostr)
        if (zapValidationError) {
          throw new Error(zapValidationError);
        }
        zapRequest = JSON.parse(nostr)
      }

      const description = zapRequest ? zapRequest.content : comment;

      const user = await db.findUser(username);

      const nwcClient = new nwc.NWCClient({
        nostrWalletConnectUrl: user.connectionSecret,
      });

      const transaction = await nwcClient.makeInvoice({
        amount: Math.floor(+amount / 1000) * 1000,
        description,
        metadata: {
          comment: comment || undefined,
          // TODO: payer_data can be improved using nostr worker
          payer_data: payerData || undefined,
          nostr: zapRequest || undefined,
        }
      });

      await db.createInvoice(user.id, transaction);

      return c.json({
        verify: `${BASE_URL}/lnurlp/${username}/verify/${transaction.payment_hash}`,
        routes: [],
        pr: transaction.invoice,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  hono.get("/:username/verify/:payment_hash", async (c) => {
    try {
      const username = c.req.param("username");
      const paymentHash = c.req.param("payment_hash");

      logger.debug("LNURLp verify", { username, payment_hash: paymentHash });

      const invoice = await db.findInvoice(paymentHash);

      return c.json({
        settled: !!invoice.settledAt,
        preimage: invoice.preimage,
        pr: invoice.paymentRequest,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  return hono;
}
