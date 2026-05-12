import { describe, expect, vi, beforeEach, Mocked, test, suite } from "vitest";
import { Request, Response } from "express";
import { makeFollowAccountController, makeUnfollowAccountController, makeGetFollowersController } from "../../src/controller/social_controller.js";
import { SocialRepository } from "../../src/data_access/social_repository.js";

const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
};

suite("Social Controllers", () => {
    let mockRepository: Mocked<SocialRepository>;

    beforeEach(() => {
        mockRepository = {
            followAccount: vi.fn(),
            unfollowAccount: vi.fn(),
            getFollowers: vi.fn(),
        } as unknown as Mocked<SocialRepository>;
    });

    describe("Follow Account", () => {
        test("Returns 401 if auth.sub (userId) is missing", async () => {
            const req = { auth: {}, body: { targetId: "target-123" } } as unknown as Request;
            const res = createMockResponse();
            const controller = makeFollowAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid Token or subject is missing (sub)", 
                code: "MISSING_SUB" 
            });
            expect(mockRepository.followAccount).not.toHaveBeenCalled();
        });

        test("Returns 400 if user tries to follow themselves", async () => {
            const req = { auth: { sub: "user-123" }, body: { targetId: "user-123" } } as unknown as Request;
            const res = createMockResponse();
            const controller = makeFollowAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "You cannot follow yourself", 
                code: "INVALID_TARGET" 
            });
            expect(mockRepository.followAccount).not.toHaveBeenCalled();
        });

        test("Returns 200 if already following the target user", async () => {
            const req = { auth: { sub: "user-123" }, body: { targetId: "target-123" } } as unknown as Request;
            const res = createMockResponse();
            
            mockRepository.followAccount.mockResolvedValue([] as any);
            const controller = makeFollowAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.followAccount).toHaveBeenCalledWith("user-123", "target-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "You are already following this user" 
            });
        });

        test("Returns 201 on successful follow", async () => {
            const req = { auth: { sub: "user-123" }, body: { targetId: "target-123" } } as unknown as Request;
            const res = createMockResponse();
            
            mockRepository.followAccount.mockResolvedValue([{ id: "follow-record-123" }] as any);
            const controller = makeFollowAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.followAccount).toHaveBeenCalledWith("user-123", "target-123");
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "You are now following user target-123" 
            });
        });
    });

    describe("Unfollow Account", () => {
        test("Returns 401 if auth.sub (userId) is missing", async () => {
            const req = { auth: {}, params: { targetId: "target-123" } } as unknown as Request<{targetId: string}>;
            const res = createMockResponse();
            const controller = makeUnfollowAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid Token or subject is missing (sub)", 
                code: "MISSING_SUB" 
            });
            expect(mockRepository.unfollowAccount).not.toHaveBeenCalled();
        });

        test("Returns 400 if user tries to unfollow themselves", async () => {
            const req = { auth: { sub: "user-123" }, params: { targetId: "user-123" } } as unknown as Request<{targetId: string}>;
            const res = createMockResponse();
            const controller = makeUnfollowAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Operation not applicable", 
                code: "INVALID_TARGET" 
            });
            expect(mockRepository.unfollowAccount).not.toHaveBeenCalled();
        });

        test("Returns 200 if user was not following the target user", async () => {
            const req = { auth: { sub: "user-123" }, params: { targetId: "target-123" } } as unknown as Request<{targetId: string}>;
            const res = createMockResponse();
            
            mockRepository.unfollowAccount.mockResolvedValue([] as any);
            const controller = makeUnfollowAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.unfollowAccount).toHaveBeenCalledWith("user-123", "target-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "You were not following this user" 
            });
        });

        test("Returns 200 on successful unfollow", async () => {
            const req = { auth: { sub: "user-123" }, params: { targetId: "target-123" } } as unknown as Request<{targetId: string}>;
            const res = createMockResponse();
            
            mockRepository.unfollowAccount.mockResolvedValue([{ id: "deleted-record-123" }] as any);
            const controller = makeUnfollowAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.unfollowAccount).toHaveBeenCalledWith("user-123", "target-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "You are no longer following user target-123" 
            });
        });
    });

    describe("Get Followers", () => {
        test("Returns 200 and the list of followers", async () => {
            const req = { params: { id: "target-123" } } as unknown as Request<{id: string}>;
            const res = createMockResponse();
            const mockFollowersList = [
                { id: "user-1", name: "Alice" },
                { id: "user-2", name: "Bob" }
            ];
            
            mockRepository.getFollowers.mockResolvedValue(mockFollowersList as any);
            const controller = makeGetFollowersController(mockRepository);

            await controller(req, res);

            expect(mockRepository.getFollowers).toHaveBeenCalledWith("target-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockFollowersList);
        });
    });
});
