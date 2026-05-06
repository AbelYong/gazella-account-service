import { and, eq } from "drizzle-orm";
import { DbClient } from "../drizzle/db.js";
import { Following } from "../drizzle/schema.js";

export class SocialRepository {
    constructor(private readonly db: DbClient) {}

    async followAccount(followerId: string, targetId: string) {
        return await this.db.insert(Following)
        .values({
            followerId: followerId,
            followedId: targetId
        })
        .onConflictDoNothing()
        .returning({
            followerId: Following.followerId,
            followedId: Following.followedId
        });
    }

    async unfollowAccount(formerFollowerId: string, targetId: string) {
        return this.db.delete(Following)
        .where(
            and(
                eq(Following.followerId, formerFollowerId),
                eq(Following.followedId, targetId)
            )
        )
        .returning({
            followedId: Following.followedId
        });
    }

    async getFollowers(targetId: string) {
        return this.db.query.Following.findMany({
            columns: {
                followerId: false,
                followedId: false
            },
            where: {
                followedId: targetId
            },
            with: {
                follower: {
                    columns: {
                        email: false,
                        bio: false,
                        joinedAt: false
                    }
                }
            }
        });
    }
}
