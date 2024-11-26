import { nwc } from "npm:@getalby/sdk";
import { decrypt } from "../db/aesgcm.ts";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

export class NWCPool {
  private readonly _db: DB;
  constructor(db: DB) {
    this._db = db;
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
      (notification) => {
        logger.debug("received notification", { userId, notification });
        if (notification.notification_type === "payment_received") {
          this._db.updateInvoice(userId, notification.notification)
        }
      },
      ["payment_received"]
    );
  }
}
