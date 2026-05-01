import { Request, Response } from "express";
import { AccountParamsInput, UpdateAccountInput } from "../schemas/account_schema.js";
import { db } from "../drizzle/db.js";
import { Accounts } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const getMyAccount = async (req: Request, res: Response) : Promise<void> => {
    const userId = req.auth?.sub;

    if (!userId) {
        res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
        return;
    }

    const account = await db.query.Accounts.findFirst({
        where: { id: userId }
    });

    if (account) {
        res.status(200).json(account);
    } else {
        res.status(404).json({message: `No account matching for ${userId} was found`});
    }
}

export const getAccountById = async (req: Request<AccountParamsInput, {}, {}>, res: Response) : Promise<void> => {
    const id = req.params.id;

    const account = await db.query.Accounts.findFirst({
        columns: {
            email: false
        },
        where: { id: id }
    });

    if (account) {
        res.status(200).json(account);
    } else {
        res.status(404).json({message: `No account matching for ${id} was found`});
    }
}

export const updateAccount = async (req: Request<{}, {}, UpdateAccountInput>, res: Response) : Promise<void> => {
    const userId = req.auth?.sub;

    if (!userId) {
        res.status(401).json({ message: "Invalid Token or subject is missing (sub)", code: "MISSING_SUB" });
        return;
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "No data to update was provided", code: "NO_CONTENT" });
        return;
    }

    const result = await db.update(Accounts)
        .set(updateData)
        .where(eq(Accounts.id, userId))
        .returning();

    if (result.length === 0) {
        res.status(404).json({ message: "No account was found for this user" });
        return;
    }

    res.status(200).json({ message: "Your profile has been successfully updated" });
};
