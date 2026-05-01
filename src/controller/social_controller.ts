import { Request, Response } from "express";
import { TargetAccountInput } from "../schemas/social_schema.js";
import { db } from "../drizzle/db.js";
import { Following } from "../drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { AccountParamsInput } from "../schemas/account_schema.js";

export const followAccount = async (req: Request<{}, {}, TargetAccountInput>, res: Response) : Promise<void> => {
    const userId = req.auth?.sub;
    const targetUserId = req.body.targetId;

    if (!userId) {
        res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
        return;
    }

    if (userId === targetUserId) {
        res.status(400).json({ message: "You cannot follow yourself", code: "INVALID_TARGET" });
        return;
    }

    const result = await db.insert(Following)
    .values({
        followerId: userId,
        followedId: targetUserId
    })
    .onConflictDoNothing()
    .returning({
        followerId: Following.followerId,
        followedId: Following.followedId
    });

    if (result.length === 0) {
        res.status(200).json({ message: "You are already following this user" });
        return;
    }

    res.status(201).json({ 
        message: `You are now following user ${targetUserId}`
    });
}

export const unfollowAccount = async (req: Request<TargetAccountInput, {}, {}>, res: Response) : Promise<void> => {
    const userId = req.auth?.sub;
    const targetUserId = req.params.targetId;

    if (!userId) {
        res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
        return;
    }

    if (userId === targetUserId) {
        res.status(400).json({ message: "Operation not applicable", code: "INVALID_TARGET" });
        return;
    }

    const result = await db.delete(Following)
    .where(
        and(
            eq(Following.followerId, userId),
            eq(Following.followedId, targetUserId)
        )
    )
    .returning({
        followedId: Following.followedId
    });

    if (result.length === 0) {
        res.status(200).json({ message: "You were not following this user" });
        return;
    }

    res.status(200).json({ 
        message: `You are no longer following user ${targetUserId}`
    });
}

export const getFollowers = async (req: Request<AccountParamsInput, {}, {}>, res: Response) : Promise<void> => {
    const targetUserId = req.params.id;

    const result = await db.query.Following.findMany({
        columns: {
            followerId: false,
            followedId: false
        },
        where: {
            followedId: targetUserId
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

    res.status(200).json(result);
}
