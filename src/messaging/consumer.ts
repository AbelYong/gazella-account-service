import amqp, { ConsumeMessage } from "amqplib";
import { UserRegisteredMsg } from "./messages.js";
import { UserRegisteredInput, UserRegisteredSchema } from "../schemas/account_schema.js";
import { DbError } from "../util/error.js";
import { AccountRepository } from "../data_access/account_repository.js";
import { ACCOUNT_QUEUE, ACCOUNT_EXCHANGE, DLQ_EXCHANGE, getRetryCount, MAX_RETRIES } from "./rabbitmq.js";

const userRegisteredRoutingKey = "user.registered";

export class AccountConsumer {
    constructor(
        private readonly channel: amqp.Channel,
        private readonly accountRepository: AccountRepository
    ) {}

    async initialize() {
        try {
            await this.channel.bindQueue(ACCOUNT_QUEUE, ACCOUNT_EXCHANGE, userRegisteredRoutingKey)

            this.channel.prefetch(1);

            this.channel.consume(ACCOUNT_QUEUE, (msg) => {
                if (!msg) {
                    return;   
                }
                this.processUserRegisteredEvent(msg);
            },
            { noAck: false }
            );

        } catch (error) {
            console.error(`Failed to initialize consumer for ${userRegisteredRoutingKey} event:`, error);
        }
    }

    async processUserRegisteredEvent(msg: ConsumeMessage) {
        try {
            const content = msg.content.toString();
            console.log(`[EVENT] A user registration event has been received from the MQ: ${content}`);
            
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
            console.error(`Failed to process event ${userRegisteredRoutingKey}:`, error);

            if (!(error instanceof DbError)) {
                console.error("An unexpected error has occurred while processing and user registered event: ", error);
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
                return;
            }

            const retries = getRetryCount(msg);

            if (retries > MAX_RETRIES) {
                this.channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
                this.channel.ack(msg);
            } else {
                console.log(`Failed to process message at attempt ${retries} de ${MAX_RETRIES}. Sending message to wait queue`);
                this.channel.nack(msg, false, false);
            }
        }
    }
}
