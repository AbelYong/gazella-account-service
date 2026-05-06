import { Request, Response } from "express";
import { TargetAccountInput } from "../schemas/social_schema.js";
import { AccountParamsInput } from "../schemas/account_schema.js";
import { SocialRepository } from "../data_access/social_repository.js";

export const makeFollowAccountController = (repository: SocialRepository) => {
    return async (req: Request<{}, {}, TargetAccountInput>, res: Response) : Promise<void> => {
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

        const result = await repository.followAccount(userId, targetUserId);

        if (result.length === 0) {
            res.status(200).json({ message: "You are already following this user" });
            return;
        }

        res.status(201).json({ 
            message: `You are now following user ${targetUserId}`
        });
    }
}

export const makeUnfollowAccountController = (repository: SocialRepository) => {
    return async (req: Request<TargetAccountInput, {}, {}>, res: Response) : Promise<void> => {
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

        const result = await repository.unfollowAccount(userId, targetUserId);

        if (result.length === 0) {
            res.status(200).json({ message: "You were not following this user" });
            return;
        }

        res.status(200).json({ 
            message: `You are no longer following user ${targetUserId}`
        });
    }
}

export const makeGetFollowersController = (repository: SocialRepository) => {
    return async (req: Request<AccountParamsInput, {}, {}>, res: Response) : Promise<void> => {
        const targetUserId = req.params.id;

        const result = await repository.getFollowers(targetUserId);

        res.status(200).json(result);
    }   
}
