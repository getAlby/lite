import { Hono } from "hono";
import { nwc } from "npm:@getalby/sdk";
import { logger } from "../src/logger.ts";
import { BASE_URL, DOMAIN } from "./constants.ts";
import { findWalletConnection } from "./db/db.ts";
import "./nwc/nwcPool.ts";

export const lnurlApp = new Hono();

lnurlApp.get("/:username", (c) => {
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

lnurlApp.get("/:username/callback", async (c) => {
  const username = c.req.param("username");
  const amount = c.req.query("amount");
  const comment = c.req.query("comment") || "";
  logger.debug("LNURLp callback", { username, amount, comment });

  // TODO: store data (e.g. for zaps)

  if (!amount) {
    throw new Error("No amount provided");
  }

  const connectionSecret = await findWalletConnection(username);

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
