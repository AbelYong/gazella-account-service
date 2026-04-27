import * as schema from "./schema.js"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
    Accounts: {
        following: r.many.Following({
            from: r.Accounts.id,
            to: r.Following.followerId
        }),
        followed: r.many.Following({
            from: r.Accounts.id,
            to: r.Following.followedId
        })
    },
    Following: {
        follower: r.one.Accounts({
            from: r.Following.followerId,
            to: r.Accounts.id
        }),
        followed: r.one.Accounts({
            from: r.Following.followedId,
            to: r.Accounts.id
        })
    }
}));
