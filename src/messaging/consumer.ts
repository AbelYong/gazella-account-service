import { rabbitMQService, ACCOUNT_QUEUE, ACCOUNT_EXCHANGE, DLQ_EXCHANGE, getRetryCount, MAX_RETRIES } from "./rabbitmq.js";
import { UserRegisteredMsg } from "./messages.js";
import { UserRegisteredInput, UserRegisteredSchema } from "../schemas/account_schema.js";
import amqp, { ConsumeMessage } from "amqplib";
import { DbError } from "../util/error.js";
import { registerNewUser } from "../data_access/account_repository.js";

const userRegisteredRoutingKey = "user.registered";

export async function consumeUserRegisteredEvents() {
    try {
        await rabbitMQService.connect();
        const channel = rabbitMQService.getChannel();

        if (!channel) {
            console.error("[RabbitMQ] Channel has not been initialized");
            return;
        }

        await channel.bindQueue(ACCOUNT_QUEUE, ACCOUNT_EXCHANGE, userRegisteredRoutingKey)

        channel.prefetch(1);

        channel.consume(ACCOUNT_QUEUE, (msg) => {
            if (!msg) {
                return;   
            }
            processUserRegisteredEvent(msg, channel);
        },
        { noAck: false }
        );

    } catch (error) {
        console.error(`Failed to initialize consumer for ${userRegisteredRoutingKey} event:`, error);
    }
}

async function processUserRegisteredEvent(msg: ConsumeMessage, channel: amqp.Channel) {
    try {
        const content = msg.content.toString();
        console.log(`[EVENT] A user registration event has been received from the MQ: ${content}`);
        
        const userData = JSON.parse(content) as UserRegisteredMsg;
        const isValid = UserRegisteredSchema.safeParse(userData);

        if (isValid.success) {
            const validUser: UserRegisteredInput = isValid.data;
            
            await registerNewUser(validUser);

            channel.ack(msg);
        } else {
            console.log(`[EVENT] A malformed user registration message has been received: ${isValid.error}`);

            channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            channel.ack(msg);
        }           
    } catch (error) {
        console.error(`Failed to process event ${userRegisteredRoutingKey}:`, error);

        if (!(error instanceof DbError)) {
            console.error("An unexpected error has occurred while processing and user registered event: ", error);
            channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            channel.ack(msg);
            return;
        }

        const retries = getRetryCount(msg);

        if (retries > MAX_RETRIES) {
            channel.publish(DLQ_EXCHANGE, "dlq.routing.key", msg.content);
            channel.ack(msg);
        } else {
            console.log(`Failed to process message at attempt ${retries} de ${MAX_RETRIES}. Sending message to wait queue`);
            channel.nack(msg, false, false);
        }
    }
}

