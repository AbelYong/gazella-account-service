import { Request, Response } from "express";
import { AccountQueryInput } from "../schemas/account_schema.js";
import { db } from "../drizzle/db.js";

export const getAccountById = async (req: Request<{}, {}, {}, AccountQueryInput>, res: Response) : Promise<void> => {
    const id = req.query["id"];

    const account = await db.query.Accounts.findFirst({
        where: { id: id }
    });

    if (account) {
        res.status(200).json(account);
    } else {
        res.status(404).json({message: `No account matching for ${id} was found`});
    }
}
