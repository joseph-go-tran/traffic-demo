import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private readonly logger = new Logger(KafkaService.name);

  constructor() {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [process.env.KAFKA_BROKER || 'kafka:29092'],
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();

    for (const [groupId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      this.logger.log(`Kafka consumer ${groupId} disconnected`);
    }
  }

  async produce(topic: string, messages: any[]) {
    try {
      await this.producer.send({
        topic,
        messages: messages.map((message) => ({
          value: JSON.stringify(message),
        })),
      });
      this.logger.log(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }

  async consume(
    topic: string,
    groupId: string,
    onMessage: (payload: EachMessagePayload) => Promise<void>,
  ) {
    const consumer = this.kafka.consumer({ groupId });

    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          this.logger.log(`Received message from topic ${topic}`);
          try {
            await onMessage(payload);
          } catch (error) {
            this.logger.error(
              `Error processing message from topic ${topic}`,
              error,
            );
          }
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`Kafka consumer ${groupId} subscribed to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to start consumer for topic ${topic}`, error);
      throw error;
    }
  }
}
