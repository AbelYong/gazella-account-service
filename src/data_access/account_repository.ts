import { eq } from "drizzle-orm";
import { DbClient } from "../drizzle/db.js";
import { Accounts } from "../drizzle/schema.js";
import { UpdateAccountInput, UserRegisteredInput } from "../schemas/account_schema.js";

export class AccountRepository {
    constructor(private readonly db: DbClient) {}

    async getOwnAccountById(id: string) {
        return await this.db.query.Accounts.findFirst({
            where: { id: id }
        });
    }

    async getAccountById(id: string) {
        return await this.db.query.Accounts.findFirst({
            columns: {
                email: false
            },
            where: { id: id }
        });
    }

    async registerNewUser(newUser: UserRegisteredInput) {
        await this.db.insert(Accounts).values({
            id: newUser.userId,
            email: newUser.email,
            name: newUser.name,
            parentalSurname: newUser.parentalSurname,
            maternalSurname: newUser.maternalSurname,
            role: newUser.role,
            joinedAt: newUser.registratedAt
        });
    }

    async updateAccount(id: string, updateData: UpdateAccountInput) {
        return await this.db.update(Accounts)
            .set(updateData)
            .where(eq(Accounts.id, id))
            .returning();
    }
}
