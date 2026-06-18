import { DbClient } from "../drizzle/db.js"
import { DbError } from "../util/error.js";

export class MessagingRepository {
    constructor(private readonly db: DbClient) {}

    async getReviewersIdsAndEmails() {
        try {
            return await this.db.query.Accounts.findMany({
                columns: {
                    id: true,
                    email: true
                },
                where: {
                    OR: [
                        {
                            role: "editor"
                        },
                        {
                            role: "moderator"
                        }
                    ]
                }
            })
        } catch (error) {
            throw new DbError(
                error instanceof Error ? error: new Error(String(error)),
                "Failed to get editor and moderator emails"
            );
        }
    }

    async getEmailByAccountId(id: string) {
        try {
            return await this.db.query.Accounts.findFirst({
                columns: {
                    email: true
                },
                where: {
                    id: id
                }
            });
        } catch (error) {
            throw new DbError(
                error instanceof Error ? error: new Error(String(error)),
                "Failed to get editor and moderator emails"
            );
        }
    }
}
