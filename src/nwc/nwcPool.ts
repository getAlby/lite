import { Event, finalizeEvent } from "@nostr/tools";
import { makeZapReceipt } from "@nostr/tools/nip57";
import { nwc } from "npm:@getalby/sdk";
import { hexToBytes } from "npm:@noble/hashes@1.3.1/utils";
import { NOSTR_NIP57_PRIVATE_KEY, NOSTR_PUBLISHER_API_TOKEN, NOSTR_PUBLISHER_API_URL } from "../constants.ts";
import { decrypt } from "../db/aesgcm.ts";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

export class NWCPool {
  private readonly _db: DB;
  private readonly publisherToken: string;
  private readonly publisherUrl: string;
  private readonly zapperPrivateKey: string;

  constructor(db: DB) {
    this._db = db;
    this.publisherToken = NOSTR_PUBLISHER_API_TOKEN;
    this.publisherUrl = NOSTR_PUBLISHER_API_URL;
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
            this._db.updateInvoice(userId, transaction)
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
    const relays = requestEvent.tags.filter(tag => tag[0] === 'relays')[0].slice(1);
    if (relays.length) {
      logger.error("no relays specified in zap request", { user_id: userId, transaction });
      return;
    }

    const signedEvent = finalizeEvent(zapReceipt, hexToBytes(this.zapperPrivateKey))

    const response = await fetch(this.publisherUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-TOKEN': this.publisherToken,
      },
      body: JSON.stringify({
        relays,
        event: signedEvent,
      }),
    });
    
    if (!response.ok) {
      logger.error("failed to publish zap", {
        user_id: userId,
        event_id: signedEvent.id, 
        payment_hash: transaction.payment_hash, 
        relays,
        response_status: response.status,
      });
    }

    logger.debug("published zap", {
      user_id: userId,
      event_id: signedEvent.id, 
      payment_hash: transaction.payment_hash,
      relays
    });
  }
}
