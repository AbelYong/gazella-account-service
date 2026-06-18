import amqp, { ConsumeMessage } from "amqplib";
import { ArticlePublishedMsg, ArticleRejectedMsg, DraftPublishedMsg, UserRegisteredMsg } from "./messages.js";
import { UserRegisteredInput, UserRegisteredSchema } from "../schemas/account_schema.js";
import { DbError } from "../util/error.js";
import { AccountRepository } from "../data_access/account_repository.js";
import { 
    ACCOUNT_QUEUE, 
    ACCOUNT_EXCHANGE, 
    ARTICLE_EXCHANGE,
    DLQ_EXCHANGE, 
    getRetryCount, 
    MAX_RETRIES, 
    RabbitMQService
} from "./rabbitmq.js";
import { ArticlePublishedInput, ArticlePublishedSchema, ArticleRejectedInput, ArticleRejectedSchema, DraftPublishedInput, DraftPublishedSchema } from "./article_schemas.js";
import { MessagingRepository } from "../data_access/messaging_repository.js";
import { ArticlePublishedOutput, ArticleRejectedOutput, DraftPublishedOutput } from "./mail_schemas.js";

const ROUTING_KEYS = {
    USER_REGISTERED: "user.registered",
    DRAFT_PUBLISHED: "draft.published",
    ARTICLE_PUBLISHED: "article.published",
    ARTICLE_REJECTED: "article.rejected"
};

export class AccountConsumer {
    private readonly channel: amqp.Channel;
    
    constructor(
        private readonly rabbitMq: RabbitMQService,
        private readonly accountRepository: AccountRepository,
        private readonly messagingRepository: MessagingRepository
    ) {
        this.channel = rabbitMq.getChannel();
    }

    async initialize() {
        try {
            await this.channel.bindQueue(ACCOUNT_QUEUE, ACCOUNT_EXCHANGE, ROUTING_KEYS.USER_REGISTERED);

            const articleRoutingKeys = [
                ROUTING_KEYS.DRAFT_PUBLISHED,
                ROUTING_KEYS.ARTICLE_PUBLISHED,
                ROUTING_KEYS.ARTICLE_REJECTED
            ];

            for (const routingKey of articleRoutingKeys) {
                await this.channel.bindQueue(ACCOUNT_QUEUE, ARTICLE_EXCHANGE, routingKey);
            }

            this.channel.prefetch(1);

            this.channel.consume(ACCOUNT_QUEUE, (msg) => {
                if (!msg) {
                    return;   
                }

                const routingKey = msg.fields.routingKey;

                switch (routingKey) {
                    case ROUTING_KEYS.USER_REGISTERED:
                        this.processUserRegisteredEvent(msg);
                        break;
                    case ROUTING_KEYS.DRAFT_PUBLISHED:
                        this.processDraftPublishedEvent(msg);
                        break;
                    case ROUTING_KEYS.ARTICLE_PUBLISHED:
                        this.processArticlePublishedEvent(msg);
                        break;
                    case ROUTING_KEYS.ARTICLE_REJECTED:
                        this.processArticleRejectedEvent(msg);
                        break;
                    default:
                        console.warn(`[EVENT] Unhandled routing key received: ${routingKey}`);
                        this.channel.nack(msg, false, false);
                        break;
                }
            },
            { noAck: false }
            );

            console.log("[RabbitMQ] Account Consumer initialized successfully.");
        } catch (error) {
            console.error(`Failed to initialize consumer:`, error);
        }
    }

    async processUserRegisteredEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A user registration event has been received: ${content}`);
            
            const userData = JSON.parse(content) as UserRegisteredMsg;
            const isValid = UserRegisteredSchema.safeParse(userData);

            if (isValid.success) {
                const validUser: UserRegisteredInput = isValid.data;
                await this.accountRepository.registerNewUser(validUser);
                this.channel.ack(msg);
            } else {
                console.log(`[EVENT] A malformed user registration message has been received: ${isValid.error}`);
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }       
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.USER_REGISTERED);
        }
    }

    async processDraftPublishedEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] Processing draft.published event: ${content}`);
            
            const msgData = JSON.parse(content) as DraftPublishedMsg;
            const isValid = DraftPublishedSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: DraftPublishedInput = isValid.data;
                
                const reviewers = await this.messagingRepository.getReviewersIdsAndEmails();

                if (reviewers.length >= 1) {
                    const newMessage: DraftPublishedOutput = {
                        reviewers,
                        ...validMsg
                    }
                    
                    this.rabbitMq.publish("draft.published", newMessage);
                } else {
                    console.warn("[EVENT] received a draft.published message, but no editors or moderators were found");
                }
                
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed draft.published message has been received: ${isValid.error}`);
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.DRAFT_PUBLISHED);
        }
    }

    async processArticlePublishedEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] Processing article.published event: ${content}`);
            
            const msgData = JSON.parse(content) as ArticlePublishedMsg;
            const isValid = ArticlePublishedSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ArticlePublishedInput = isValid.data;
                
                const fetch = await this.messagingRepository.getEmailByAccountId(validMsg.authorId);
                const authorEmail = fetch?.email;

                if (authorEmail) {
                    const newMessage: ArticlePublishedOutput = {
                        authorEmail,
                        ...validMsg
                    }

                    this.rabbitMq.publish("article.published", newMessage);
                } else {
                    console.warn(`[EVENT] received an article.published message, but no email was found for author ${validMsg.authorId}`);
                }
                
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed article.published message has been received: ${isValid.error}`);
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.ARTICLE_PUBLISHED);
        }
    }

    async processArticleRejectedEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] Processing article.rejected event: ${content}`);
            
            const msgData = JSON.parse(content) as ArticleRejectedMsg;
            const isValid = ArticleRejectedSchema.safeParse(msgData);

            if (isValid.success) {
                const validMsg: ArticleRejectedInput = isValid.data;
                
                const fetch = await this.messagingRepository.getEmailByAccountId(validMsg.authorId);
                const authorEmail = fetch?.email;

                if (authorEmail) {
                    const newMessage: ArticleRejectedOutput = {
                        authorEmail,
                        ...validMsg
                    }

                    this.rabbitMq.publish("article.rejected", newMessage);
                } else {
                    console.warn(`[EVENT] received an article.rejected message, but no email was found for author ${validMsg.authorId}`);
                }
                
                this.channel.ack(msg);
            } else {
                console.warn(`[EVENT] A malformed article.rejected message has been received: ${isValid.error}`);
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            }
        } catch (error) {
            this.handleProcessingError(error, msg, ROUTING_KEYS.ARTICLE_REJECTED);
        }
    }

    private handleProcessingError(error: any, msg: ConsumeMessage, routingKey: string) {
        console.error(`Failed to process event ${routingKey}:`, error);

        if (!(error instanceof DbError)) {
            console.error(`An unexpected error has occurred while processing ${routingKey}: `, error);
            this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            this.channel.ack(msg);
            return;
        }

        const retries = getRetryCount(msg);

        if (retries > MAX_RETRIES) {
            this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            this.channel.ack(msg);
        } else {
            console.log(`Failed to process message at attempt ${retries} of ${MAX_RETRIES}. Sending message to wait queue`);
            this.channel.nack(msg, false, false);
        }
    }
}