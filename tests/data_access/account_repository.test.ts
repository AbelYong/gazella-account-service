import { describe, test, expect, beforeEach, suite } from "vitest";
import { db } from "../../src/drizzle/db.js";
import { Accounts } from "../../src/drizzle/schema.js";
import { AccountRepository } from "../../src/data_access/account_repository.js";
import { UserRegisteredInput } from "../../src/schemas/account_schema.js";

suite("Account Repository", () => {
    let respository = new AccountRepository(db);
    let testId = "95a62132-8602-4df2-87fe-cba5432f442d"; 
    
    beforeEach(async () => {
        await db.delete(Accounts);
    });

    describe("Get Account by Id, returns account", () => {
        test("Should retrieve the users account, should not include email", async () => {
            const testDate = new Date()
            await db.insert(Accounts).values({
                id: testId,
                email: "test@test.com",
                name: "tester",
                parentalSurname: undefined,
                maternalSurname: undefined,
                role: "volunteer",
                joinedAt: testDate
            });

            const result = await respository.getAccountById(testId);
            expect(result).not.toBeUndefined();
            expect(result).not.toHaveProperty("email");
            expect(result?.name).toBe("tester");
        });

        test("Returns undefined if account does not exist", async () => {
            const result = await respository.getAccountById(testId);
            expect(result).toBeUndefined();
        });
    });

    describe("Get Own Account by Id", () => {
        test("Should retrieve the users account and include the email", async () => {
            const testDate = new Date();
            await db.insert(Accounts).values({
                id: testId,
                email: "own@test.com",
                name: "ownTester",
                role: "volunteer",
                joinedAt: testDate
            });

            const result = await respository.getOwnAccountById(testId);
            
            expect(result).not.toBeUndefined();
            expect(result).toHaveProperty("email", "own@test.com");
            expect(result?.name).toBe("ownTester");
        });

        test("Returns undefined if account does not exist", async () => {
            const result = await respository.getOwnAccountById(testId);
            expect(result).toBeUndefined();
        });
    });

    describe("Register New User", () => {
        test("Should successfully insert a new user into the database", async () => {
            const testDate = new Date();
            const newUser: UserRegisteredInput =
            {
                userId: testId,
                email: "new@test.com",
                name: "newUser",
                parentalSurname: "Doe",
                maternalSurname: "Smith",
                role: "user",
                registratedAt: testDate
            };

            await respository.registerNewUser(newUser);

            const result = await respository.getOwnAccountById(testId);
            
            expect(result).not.toBeUndefined();
            expect(result?.email).toBe("new@test.com");
            expect(result?.name).toBe("newUser");
            expect(result?.parentalSurname).toBe("Doe");
            expect(result?.maternalSurname).toBe("Smith");
            expect(result?.role).toBe("user");
        });
    });

    describe("Update Account", () => {
        test("Should update the account and return an array containing the updated object", async () => {
            const testDate = new Date();
            await db.insert(Accounts).values({
                id: testId,
                email: "update@test.com",
                name: "oldName",
                role: "user",
                joinedAt: testDate
            });

            const updateData = {
                name: "newName",
                bio: "New biography"
            };

            const result = await respository.updateAccount(testId, updateData);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0]?.id).toBe(testId);
            expect(result[0]?.name).toBe("newName");
            expect(result[0]?.bio).toBe("New biography");
            expect(result[0]?.email).toBe("update@test.com"); // Verify other fields weren't wiped
        });

        test("Should return an empty array if the account to update does not exist", async () => {
            const updateData = {
                name: "newName"
            };

            const result = await respository.updateAccount(testId, updateData);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });
});
