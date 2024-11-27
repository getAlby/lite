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
export const NOSTR_PUBLISHER_API_TOKEN = Deno.env.get("NOSTR_PUBLISHER_API_TOKEN") || "";
export const NOSTR_PUBLISHER_API_URL = Deno.env.get("NOSTR_PUBLISHER_API_URL") || "https://nostr-publisher.getalby.workers.dev";
