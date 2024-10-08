import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  encryptedConnectionSecret: text("connection_secret").notNull(),
  username: text("username").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
