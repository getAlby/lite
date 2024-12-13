ALTER TABLE "users" ADD COLUMN "nostr_pubkey" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nostr_pubkey_unique" UNIQUE("nostr_pubkey");