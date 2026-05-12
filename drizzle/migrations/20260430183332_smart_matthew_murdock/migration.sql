ALTER TABLE "accounts" ADD COLUMN "role" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "joined_at" timestamp NOT NULL;