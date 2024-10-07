import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { nwc } from "npm:@getalby/sdk";
import postgres from "postgres";

import { eq } from "drizzle-orm";
import { DATABASE_URL } from "../constants.ts";
import * as schema from "./schema.ts";
import { users } from "./schema.ts";

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

    await this._db.insert(users).values({
      connectionSecret,
      username,
    });

    return { username };
  }

  getAllUsers() {
    return this._db.query.users.findMany();
  }

  async findWalletConnection(username: string) {
    const result = await this._db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (!result) {
      throw new Error("user not found");
    }
    return result?.connectionSecret;
  }
}
