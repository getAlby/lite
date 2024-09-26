import { nwc } from "npm:@getalby/sdk";
import { getAllUsers } from "../db/db.ts";
import { logger } from "../logger.ts";

export class NWCPool {
  readonly _nwcs: nwc.NWCClient[];
  constructor() {
    this._nwcs = [];

    (async () => {
      const users = await getAllUsers();
      for (const user of users) {
        this.addNWCClient(user.connectionSecret, user.username);
      }
    })();
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

export const nwcPool = new NWCPool();
