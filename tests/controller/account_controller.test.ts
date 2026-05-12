import { describe, expect, vi, beforeEach, Mocked, test, suite } from "vitest";
import { Request, Response } from "express";
import { makeGetMyAccountController, makeGetAccountByIdController, makeUpdateAccountController } from "../../src/controller/account_controller.js";
import { AccountRepository } from "../../src/data_access/account_repository.js";

const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
};

suite("Account Controllers", () => {
    let mockRepository: Mocked<AccountRepository>;

    beforeEach(() => {
        mockRepository = {
            getOwnAccountById: vi.fn(),
            getAccountById: vi.fn(),
            registerNewUser: vi.fn(),
            updateAccount: vi.fn(),
        } as unknown as Mocked<AccountRepository>;
    });

    describe("Get own Account", () => {
        test("Returns 401 if auth.sub (userId) is missing", async () => {
            const req = { auth: {} } as unknown as Request;
            const res = createMockResponse();
            const controller = makeGetMyAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid Token or subject is missing (sub)", 
                code: "MISSING_SUB" 
            });
            expect(mockRepository.getOwnAccountById).not.toHaveBeenCalled();
        });

        test("Returns 200 and the account if found", async () => {
            const req = { auth: { sub: "user-123" } } as unknown as Request;
            const res = createMockResponse();
            const mockAccount = { id: "user-123", name: "John Doe" };
            
            mockRepository.getOwnAccountById.mockResolvedValue(mockAccount as any);
            const controller = makeGetMyAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.getOwnAccountById).toHaveBeenCalledWith("user-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockAccount);
        });

        test("Returns 404 if no account matches the userId", async () => {
            const req = { auth: { sub: "user-123" } } as unknown as Request;
            const res = createMockResponse();
            
            mockRepository.getOwnAccountById.mockResolvedValue(undefined as any);
            const controller = makeGetMyAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.getOwnAccountById).toHaveBeenCalledWith("user-123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "No account matching for user-123 was found" 
            });
        });
    });

    describe("Get someone's account by Id", () => {
        test("Returns 200 and the account if found", async () => {
            const req = { params: { id: "target-123" } } as unknown as Request<{ id: string }>;
            const res = createMockResponse();
            const mockAccount = { id: "target-123", name: "Jane Doe" };
            
            mockRepository.getAccountById.mockResolvedValue(mockAccount as any);
            const controller = makeGetAccountByIdController(mockRepository);

            await controller(req, res);

            expect(mockRepository.getAccountById).toHaveBeenCalledWith("target-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockAccount);
        });

        test("Returns 404 if account is not found", async () => {
            const req = { params: { id: "target-123" } } as unknown as Request<{ id: string }>;
            const res = createMockResponse();
            
            mockRepository.getAccountById.mockResolvedValue(undefined as any);
            const controller = makeGetAccountByIdController(mockRepository);

            await controller(req, res);

            expect(mockRepository.getAccountById).toHaveBeenCalledWith("target-123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "No account matching for target-123 was found" 
            });
        });
    });

    describe("Update own account", () => {
        test("Returns 401 if auth.sub (userId) is missing", async () => {
            const req = { auth: {}, body: { name: "New Name" } } as unknown as Request;
            const res = createMockResponse();
            const controller = makeUpdateAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid Token or subject is missing (sub)", 
                code: "MISSING_SUB" 
            });
            expect(mockRepository.updateAccount).not.toHaveBeenCalled();
        });

        test("Returns 400 if update data payload is empty", async () => {
            const req = { auth: { sub: "user-123" }, body: {} } as unknown as Request;
            const res = createMockResponse();
            const controller = makeUpdateAccountController(mockRepository);

            await controller(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "No data to update was provided", 
                code: "NO_CONTENT" 
            });
            expect(mockRepository.updateAccount).not.toHaveBeenCalled();
        });

        test("Returns 404 if repository update operation yields empty result", async () => {
            const updatePayload = { name: "New Name" };
            const req = { auth: { sub: "user-123" }, body: updatePayload } as unknown as Request;
            const res = createMockResponse();
            
            mockRepository.updateAccount.mockResolvedValue([] as any);
            const controller = makeUpdateAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.updateAccount).toHaveBeenCalledWith("user-123", updatePayload);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "No account was found for this user" 
            });
        });

        test("Returns 200 on successful update", async () => {
            const updatePayload = { name: "New Name" };
            const req = { auth: { sub: "user-123" }, body: updatePayload } as unknown as Request;
            const res = createMockResponse();
            
            mockRepository.updateAccount.mockResolvedValue([{ id: "user-123", name: "New Name" }] as any);
            const controller = makeUpdateAccountController(mockRepository);

            await controller(req, res);

            expect(mockRepository.updateAccount).toHaveBeenCalledWith("user-123", updatePayload);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Your profile has been successfully updated" 
            });
        });
    });
});
