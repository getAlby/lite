import { Event, finalizeEvent, SimplePool } from "@nostr/tools";
import { makeZapReceipt } from "@nostr/tools/nip57";
import { nwc } from "npm:@getalby/sdk";
import { hexToBytes } from "npm:@noble/hashes@1.3.1/utils";
import { NOSTR_NIP57_PRIVATE_KEY } from "../constants.ts";
import { decrypt } from "../db/aesgcm.ts";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

export class NWCPool {
  private readonly _db: DB;
  private readonly pool: SimplePool;
  private readonly zapperPrivateKey: string;

  constructor(db: DB) {
    this._db = db;
    this.pool = new SimplePool()
    this.zapperPrivateKey = NOSTR_NIP57_PRIVATE_KEY;
  }

  async init() {
    const users = await this._db.getAllUsers();
    for (const user of users) {
      const connectionSecret = await decrypt(user.encryptedConnectionSecret);
      this.subscribeUser(connectionSecret, user.id);
    }
  }

  subscribeUser(connectionSecret: string, userId: number) {
    logger.debug("subscribing to user", { userId });
    const nwcClient = new nwc.NWCClient({
      nostrWalletConnectUrl: connectionSecret,
    });

    nwcClient.subscribeNotifications(
      async (notification) => {
        logger.debug("received notification", { userId, notification });
        if (notification.notification_type === "payment_received") {
          const transaction = notification.notification
          try {
            this._db.markInvoiceSettled(userId, transaction)
            await this.publishZap(userId, transaction)
          } catch (error) {
            logger.error("error processing payment_received notification", { userId, transaction, error });
          }
        }
      },
      ["payment_received"]
    );
  }

  async publishZap(userId: number, transaction: nwc.Nip47Transaction) {
    const metadata = transaction.metadata
    const requestEvent = metadata?.nostr as Event

    if (!requestEvent) {
      return;
    }

    const zapReceipt = makeZapReceipt({
      zapRequest: JSON.stringify(requestEvent),
      preimage: transaction.preimage,
      bolt11: transaction.invoice,
      paidAt: new Date(transaction.settled_at * 1000)
    })
    const relays = requestEvent.tags.find(tag => tag[0] === 'relays')?.slice(1);
    if (!relays || !relays.length) {
      logger.error("no relays specified in zap request", { user_id: userId, transaction });
      return;
    }

    const signedEvent = finalizeEvent(zapReceipt, hexToBytes(this.zapperPrivateKey))

    const results = await Promise.allSettled(this.pool.publish(relays, signedEvent))

    const successfulRelays: string[] = [];
    const failedRelays: string[] = [];

    results.forEach((result, index) => {
      const relay = relays[index];
      if (result.status === 'fulfilled') {
        successfulRelays.push(relay);
      } else {
        failedRelays.push(relay);
      }
    });

    if (failedRelays.length === relays.length) {
      logger.error("failed to publish zap", {
        user_id: userId,
        event_id: signedEvent.id, 
        payment_hash: transaction.payment_hash,
        failed_relays: relays, 
      });
      return;
    }

    logger.debug("published zap", {
      user_id: userId,
      event_id: signedEvent.id, 
      payment_hash: transaction.payment_hash,
      successful_relays: successfulRelays,
      failed_relays: failedRelays,
    });
  }
}
