import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { nwc } from "npm:@getalby/sdk";
import postgres from "postgres";

import { and, eq } from "drizzle-orm";
import { DATABASE_URL } from "../constants.ts";
import { decrypt, encrypt } from "./aesgcm.ts";
import * as schema from "./schema.ts";
import { invoices, users } from "./schema.ts";

export async function runMigration() {
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./drizzle",
  });
}

export class DB {
  private _db: PostgresJsDatabase<typeof schema>;

  constructor() {
    const queryClient = postgres(DATABASE_URL);
    this._db = drizzle(queryClient, {
      schema,
    });
  }

  async createUser(
    connectionSecret: string,
    username?: string
  ): Promise<{ username: string }> {
    const parsed = nwc.NWCClient.parseWalletConnectUrl(connectionSecret);
    if (!parsed.secret) {
      throw new Error("no secret found in connection secret");
    }

    // TODO: use haikunator
    username = username || Math.floor(Math.random() * 100000000000).toString();

    const encryptedConnectionSecret = await encrypt(connectionSecret);

    await this._db.insert(users).values({
      encryptedConnectionSecret,
      username,
    });

    return { username };
  }

  getAllUsers() {
    return this._db.query.users.findMany();
  }

  async findUser(username: string) {
    const result = await this._db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (!result) {
      throw new Error("user not found");
    }
    const connectionSecret = await decrypt(result.encryptedConnectionSecret);
    return {
      id: result.id,
      connectionSecret
    };
  }

  async createInvoice(
    userId: number,
    transaction: nwc.Nip47Transaction
  ): Promise<{ identifier: string }> {
    await this._db.insert(invoices).values({
      userId,
      amount: transaction.amount,
      description: transaction.description,
      descriptionHash: transaction.description_hash,
      paymentRequest: transaction.invoice,
      paymentHash: transaction.payment_hash,
      metadata: transaction.metadata,
    });

    return { identifier: transaction.payment_hash };
  }

  async findInvoice(identifier: string) {
    const result = await this._db.query.invoices.findFirst({
      where: eq(invoices.paymentHash, identifier),
    });
    if (!result) {
      throw new Error("invoice not found");
    }
    return result;
  }

  async updateInvoice(
    userId: number,
    transaction: nwc.Nip47Transaction
  ): Promise<void> {
    await this._db
      .update(invoices)
      .set({
        preimage: transaction.preimage,
        settledAt: new Date(transaction.settled_at * 1000),
      })
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.paymentHash, transaction.payment_hash)
        )
      )

    return;
  }
}
