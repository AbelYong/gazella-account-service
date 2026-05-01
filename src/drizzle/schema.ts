import * as pg from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const Accounts = pgTable(
    "accounts", {
        id: pg.uuid("id").primaryKey().notNull(),
        email: pg.varchar("email", { length: 128 } ).notNull(),
        pfpUri: pg.varchar("pfp_uri", { length: 256 }),
        name: pg.varchar("name", { length: 32 } ).notNull(),
        parentalSurname: pg.varchar("paternal_surname", { length: 32} ),
        maternalSurname: pg.varchar("maternal_surname", { length: 32} ),
        bio: pg.varchar("bio", { length: 512 }),
        role: pg.varchar("role", {length: 64}).notNull(),
        joinedAt: pg.timestamp("joined_at").notNull(),
    }, (table) => [
        pg.uniqueIndex("email_unqIndex").on(table.email)
    ]
);

export const Following = pgTable(
    "following", {
        followerId: pg.uuid("follower_id").references(() => Accounts.id).notNull(),
        followedId: pg.uuid("followed_id").references(() => Accounts.id).notNull()
    }, (table) => [
        pg.primaryKey({ columns: [table.followerId, table.followedId] })
    ]
);
