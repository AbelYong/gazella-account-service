CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY,
	"email" varchar(128) NOT NULL,
	"pfp_uri" varchar(256),
	"name" varchar(32) NOT NULL,
	"paternal_surname" varchar(32),
	"maternal_surname" varchar(32),
	"bio" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "following" (
	"follower_id" uuid,
	"followed_id" uuid,
	CONSTRAINT "following_pkey" PRIMARY KEY("follower_id","followed_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_unqIndex" ON "accounts" ("email");--> statement-breakpoint
ALTER TABLE "following" ADD CONSTRAINT "following_follower_id_accounts_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "following" ADD CONSTRAINT "following_followed_id_accounts_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "accounts"("id");