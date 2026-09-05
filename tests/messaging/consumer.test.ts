import { describe, test, beforeAll, beforeEach, afterAll, expect, vi, Mocked } from "vitest";
import { AccountConsumer } from "../../src/messaging/consumer.js";
import { AccountRepository } from "../../src/data_access/account_repository.js";
import { MessagingRepository } from "../../src/data_access/messaging_repository.js";
import { RabbitMQService, ACCOUNT_EXCHANGE, ARTICLE_EXCHANGE } from "../../src/messaging/rabbitmq.js";

const testUuid = "438620bf-0884-483b-9cd2-a965caaae1f5";
const testUuid2 = "97c813c9-5b3c-4f56-ac59-f911337a8730";

describe("Account Consumer - RabbitMQ Integration", () => {
    let rabbitMQService: RabbitMQService;
    let mockAccountRepo: Mocked<AccountRepository>;
    let mockMessagingRepo: Mocked<MessagingRepository>;
    let consumer: AccountConsumer;

    beforeAll(async () => {
        rabbitMQService = new RabbitMQService(process.env["RABBITMQ_URL"]!, 5000);
        await rabbitMQService.connect();

        // Initialize mocks once to prevent listener duplication
        mockAccountRepo = {
            registerNewUser: vi.fn(),
        } as unknown as Mocked<AccountRepository>;

        mockMessagingRepo = {
            getReviewersIdsAndEmails: vi.fn(),
            getEmailByAccountId: vi.fn(),
        } as unknown as Mocked<MessagingRepository>;

        consumer = new AccountConsumer(rabbitMQService, mockAccountRepo, mockMessagingRepo);
        await consumer.initialize();
    }, 60000);

    afterAll(async () => {
        const channel = rabbitMQService.getChannel();
        if (channel) {
            channel.on("error", () => {});
        }
        await rabbitMQService.close();
    });

    beforeEach(() => {
        // Reset mock states and resolved values before each test
        vi.clearAllMocks();
    });

    test("Should consume user.registered event and trigger repository storage", async () => {
        const mockUserEvent = {
            userId: testUuid,
            email: "test@gazella.local",
            name: "Jane Doe",
            role: "volunteer",
            registratedAt: new Date().toISOString(),
        };

        rabbitMQService.getChannel().publish(
            ACCOUNT_EXCHANGE,
            "user.registered",
            Buffer.from(JSON.stringify(mockUserEvent))
        );

        await vi.waitFor(() => {
            // Use objectContaining to avoid failing strict equality on Date objects
            expect(mockAccountRepo.registerNewUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: testUuid,
                    email: "test@gazella.local",
                    name: "Jane Doe"
                })
            );
        }, { timeout: 5000 });
    });

    test("Should consume draft.published event and fetch reviewers from messaging repository", async () => {
        const mockDraftEvent = {
            draftId: testUuid,
            authorId: testUuid2,
            title: "Sample Draft",
            authorName: "John Doe",
            summary: "This is a sample draft summary."
        };

        mockMessagingRepo.getReviewersIdsAndEmails.mockResolvedValue([
            { id: "rev-1", email: "rev@gazella.local" }
        ]);

        rabbitMQService.getChannel().publish(
            ARTICLE_EXCHANGE,
            "draft.published",
            Buffer.from(JSON.stringify(mockDraftEvent))
        );

        await vi.waitFor(() => {
            expect(mockMessagingRepo.getReviewersIdsAndEmails).toHaveBeenCalled();
        }, { timeout: 5000 });
    });

    test("Should consume article.published event and fetch the author's email", async () => {
        const mockArticleEvent = {
            articleId: testUuid,
            authorId: testUuid2,
            title: "Sample Article",
            authorName: "John Doe",
        };

        mockMessagingRepo.getEmailByAccountId.mockResolvedValue({ email: "test@gazella.local" });

        rabbitMQService.getChannel().publish(
            ARTICLE_EXCHANGE,
            "article.published",
            Buffer.from(JSON.stringify(mockArticleEvent))
        );

        await vi.waitFor(() => {
            expect(mockMessagingRepo.getEmailByAccountId).toHaveBeenCalledWith(mockArticleEvent.authorId);
        }, { timeout: 5000 });
    });
});
