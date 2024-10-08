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
