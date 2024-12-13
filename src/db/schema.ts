import { bigint, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  encryptedConnectionSecret: text("connection_secret").notNull(),
  username: text("username").unique().notNull(),
  nostrPubkey: text("nostr_pubkey").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  description: text("description"),
  paymentRequest: text("payment_request").unique().notNull(),
  paymentHash: text("payment_hash").unique().notNull(),
  preimage: text("preimage"),
  metadata: jsonb("metadata"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("user_id_idx").on(table.userId),
    userPaymentHashIdx: index("user_payment_hash_idx").on(table.userId, table.paymentHash),
  };
});
