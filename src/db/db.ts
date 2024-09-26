import { drizzle } from "drizzle-orm/postgres-js";
import { nwc } from "npm:@getalby/sdk";
import postgres from "postgres";

import { eq } from "drizzle-orm";
import { DATABASE_URL } from "../constants.ts";
import * as schema from "./schema.ts";
import { users } from "./schema.ts";

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient, {
  schema,
});

export async function createUser(
  connectionSecret: string,
  username?: string
): Promise<{ username: string }> {
  const parsed = nwc.NWCClient.parseWalletConnectUrl(connectionSecret);
  if (!parsed.secret) {
    throw new Error("no secret found in connection secret");
  }

  // TODO: use haikunator
  username = username || Math.floor(Math.random() * 100000000000).toString();

  await db.insert(users).values({
    connectionSecret,
    username,
  });

  return { username };
}

export function getAllUsers() {
  return db.query.users.findMany();
}

export async function findWalletConnection(username: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!result) {
    throw new Error("user not found");
  }
  return result?.connectionSecret;
}
