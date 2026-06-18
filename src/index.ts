import express from "express";
import dotenv from "dotenv";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { db } from "./drizzle/db.js";
import { rabbitMQService } from "./messaging/rabbitmq.js";
import { globalErrorHandler } from "./handlers/error_handler.js";
import { AccountRepository } from "./data_access/account_repository.js";
import { AccountConsumer } from "./messaging/consumer.js";
import { swaggerOptions } from "./swagger.js";
import routes from "./routes.js";
import { MessagingRepository } from "./data_access/messaging_repository.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");

const specs = swaggerJsDoc(swaggerOptions);

async function startServer() {
    try {
        app.use(express.json());

        if (process.env["NODE_ENV"] === "development") {
            app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
        }

        app.use("/", routes);

        await bootstrap();

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

async function bootstrap() {
    await rabbitMQService.connect();

    const accountRepository = new AccountRepository(db);
    const messagingRepository = new MessagingRepository(db);
    const consumer = new AccountConsumer(rabbitMQService, accountRepository, messagingRepository);

    await consumer.initialize();
}

process.on("SIGINT", async() => {
    await rabbitMQService.close();
    process.exit(0);
});

await startServer();
