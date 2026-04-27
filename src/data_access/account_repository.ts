import { db } from "../drizzle/db.js";
import { UserRegisteredInput } from "../schemas/account_schema.js";
import { Accounts } from "../drizzle/schema.js";

export async function registerNewUser(newUser: UserRegisteredInput) {
    await db.insert(Accounts).values({
        id: newUser.userId,
        email: newUser.email,
        name: newUser.name,
        parentalSurname: newUser.parentalSurname,
        maternalSurname: newUser.maternalSurname
    });
}

export async function getAccountById(id: string) {
    return await db.query.Accounts.findFirst({
        where: { id: id }
    });
}
