import { describe, test, expect, beforeEach, suite } from "vitest";
import { db } from "../../src/drizzle/db.js";
import { Accounts, Following } from "../../src/drizzle/schema.js";
import { SocialRepository } from "../../src/data_access/social_repository.js";

suite("Social Repository", () => {
    let repository = new SocialRepository(db);
    
    const user1Id = "11111111-1111-1111-1111-111111111111";
    const user2Id = "22222222-2222-2222-2222-222222222222";
    const user3Id = "33333333-3333-3333-3333-333333333333";
    
    beforeEach(async () => {
        await db.delete(Following);
        await db.delete(Accounts);

        const testDate = new Date();
        await db.insert(Accounts).values([
            { id: user1Id, email: "user1@test.com", name: "User One", role: "user", joinedAt: testDate },
            { id: user2Id, email: "user2@test.com", name: "User Two", role: "user", joinedAt: testDate },
            { id: user3Id, email: "user3@test.com", name: "User Three", role: "user", joinedAt: testDate },
        ]);
    });

    describe("Follow Account", () => {
        test("Should successfully follow a user and return the tracking record", async () => {
            const result = await repository.followAccount(user1Id, user2Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                followerId: user1Id,
                followedId: user2Id
            });
        });

        test("Should return an empty array if already following the user (Conflict)", async () => {
            await repository.followAccount(user1Id, user2Id);
            
            const result = await repository.followAccount(user1Id, user2Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });

    describe("Unfollow Account", () => {
        test("Should successfully unfollow a user and return the deleted record's followedId", async () => {
            await repository.followAccount(user1Id, user2Id);

            const result = await repository.unfollowAccount(user1Id, user2Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                followedId: user2Id
            });
        });

        test("Should return an empty array if not following the user", async () => {
            const result = await repository.unfollowAccount(user1Id, user2Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });

    describe("Get Followers", () => {
        test("Should return a formatted list of followers for a given user", async () => {
            await repository.followAccount(user1Id, user2Id);
            await repository.followAccount(user3Id, user2Id);

            const result = await repository.getFollowers(user2Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            
            const followerOne = result.find(f => f.follower?.id === user1Id)?.follower;
            expect(followerOne).toBeDefined();
            expect(followerOne?.name).toBe("User One");
            expect(followerOne?.role).toBe("user");
            
            // Ensure excluded properties are undefined
            expect(followerOne).not.toHaveProperty("email");
            expect(followerOne).not.toHaveProperty("bio");
            expect(followerOne).not.toHaveProperty("joinedAt");
        });

        test("Should return an empty array if the user has no followers", async () => {
            const result = await repository.getFollowers(user1Id);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });
});