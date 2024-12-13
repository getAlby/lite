import { getPublicKey } from "@nostr/tools";
import { hexToBytes } from "npm:@noble/hashes@1.3.1/utils";

export const PORT = parseInt(Deno.env.get("PORT") || "8080");
export const BASE_URL = Deno.env.get("BASE_URL");
if (!BASE_URL) {
  console.log("no BASE_URL provided, exiting");
  Deno.exit(1);
}
export const DOMAIN = BASE_URL.split("//")[1];
const databaseUrl = Deno.env.get("DATABASE_URL");
if (!databaseUrl) {
  console.log("no DATABASE_URL provided, exiting");
  Deno.exit(1);
}
export const DATABASE_URL = databaseUrl;

export const NOSTR_NIP57_PRIVATE_KEY = Deno.env.get("NOSTR_NIP57_PRIVATE_KEY") || "";
export const NOSTR_NIP57_PUBLIC_KEY = NOSTR_NIP57_PRIVATE_KEY ? getPublicKey(hexToBytes(NOSTR_NIP57_PRIVATE_KEY)) : "";
