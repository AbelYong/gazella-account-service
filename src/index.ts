import express from "express"
import dotenv from "dotenv"
import { rabbitMQService } from "./messaging/rabbitmq.js";
import { globalErrorHandler } from "./handlers/error_handler.js";
import { consumeUserRegisteredEvents } from "./messaging/consumer.js";
import { AccountQuerySchema, UpdateAccountSchema } from "./schemas/account_schema.js";
import { asyncHandler } from "./handlers/async_handler.js";
import { validateBody, validateQuery } from "./validators/request_validator.js";
import { getAccountById, updateAccount } from "./controller/account_controller.js";
import { requireAuth } from "./validators/auth_validator.js";

dotenv.config();

const app = express();

async function startServer() {
    try {
        app.use(express.json());

        app.get("/accounts", validateQuery(AccountQuerySchema), asyncHandler(getAccountById));
        app.patch("/accounts", requireAuth, validateBody(UpdateAccountSchema), asyncHandler(updateAccount));
        /*
        app.post("/social");
        app.delete("/social");
        app.get("/followers");
        */

        await rabbitMQService.connect();
        await consumeUserRegisteredEvents();

        app.use(globalErrorHandler);

        const PORT = process.env["PORT"] || 5000;
        app.listen(PORT, () => {
            console.log(`Account Service listening on ${PORT}`);
        });
    } catch (error) {
        console.error("Failure on startup:", error);
        process.exit(1);
    }
}

process.on("SIGINT", async() => {
    await rabbitMQService.close();
    process.exit(0);
});

await startServer();
