import { validateEvent } from "@nostr/tools";
import { Context, Hono } from "hono";
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

async function computeDescriptionHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function createLnurlWellKnownApp(db: DB) {
  const hono = new Hono();

  hono.get("/:username", async (c: Context) => {
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

  hono.get("/:username/callback", async (c: Context) => {
    try {
      const username = c.req.param("username");
      const amount = c.req.query("amount");
      const comment = c.req.query("comment") || "";
      const payerData = c.req.query("payerdata") ? JSON.parse(c.req.query("payerdata") || "") : null;
      const nostr = c.req.query("nostr") ? JSON.parse(decodeURIComponent(c.req.query("nostr") || "")) : null;

      logger.debug("LNURLp callback", { username, amount, comment, payerData, nostr });

      if (!amount) {
        throw new Error("No amount provided");
      }

      const isZapRequestValid = validateEvent(nostr)
      const description = isZapRequestValid ? nostr.content : comment;

      const content = isZapRequestValid ? JSON.stringify(nostr) : getLnurlMetadata(username);
      const descriptionHash = await computeDescriptionHash(content);

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
          nostr: isZapRequestValid ? nostr : undefined,
        },
        description_hash: descriptionHash,
      });

      const invoice = await db.createInvoice(user.id, transaction);

      return c.json({
        verify: `${BASE_URL}/lnurlp/${username}/verify/${invoice.identifier}`,
        routes: [],
        pr: transaction.invoice,
      });
    } catch (error) {
      return c.json({ status: "ERROR", reason: "" + error });
    }
  });

  hono.get("/:username/verify/:identifier", async (c: Context) => {
    try {
      const username = c.req.param("username");
      const identifier = c.req.param("identifier");

      logger.debug("LNURLp verify", { username, identifier });

      const invoice = await db.findInvoice(identifier);

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
