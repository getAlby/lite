import { nwc } from "npm:@getalby/sdk";
import { DB } from "../db/db.ts";
import { logger } from "../logger.ts";

export class NWCPool {
  private readonly _db: DB;
  private readonly _nwcs: nwc.NWCClient[];
  constructor(db: DB) {
    this._nwcs = [];
    this._db = db;
  }

  async init() {
    const users = await this._db.getAllUsers();
    for (const user of users) {
      this.addNWCClient(user.connectionSecret, user.username);
    }
  }

  addNWCClient(connectionSecret: string, username: string) {
    logger.debug("subscribing to user", { username });
    const nwcClient = new nwc.NWCClient({
      nostrWalletConnectUrl: connectionSecret,
    });

    nwcClient.subscribeNotifications(
      (notification) => {
        logger.debug("received notification", { username, notification });
      },
      ["payment_received"]
    );
  }
}
