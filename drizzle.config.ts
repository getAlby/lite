import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/constants.ts";
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
