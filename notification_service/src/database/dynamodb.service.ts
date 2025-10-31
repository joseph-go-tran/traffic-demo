import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import {
  createDynamoDBClient,
  NOTIFICATION_HISTORY_TABLE,
} from '@/config/dynamodb.config';

export interface NotificationHistory {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  recipient?: string; // userId, channel, or 'all'
  recipientType: 'user' | 'channel' | 'all';
  timestamp: number;
  createdAt: string;
}

@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);
  private readonly docClient = createDynamoDBClient();
  private readonly client: DynamoDBClient;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:5433',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
      },
    });
  }

  async onModuleInit() {
    await this.initializeTable();
  }

  private async initializeTable() {
    try {
      // Check if table exists
      const describeCommand = new DescribeTableCommand({
        TableName: NOTIFICATION_HISTORY_TABLE,
      });
      await this.client.send(describeCommand);
      this.logger.log(`Table ${NOTIFICATION_HISTORY_TABLE} already exists`);
    } catch (error) {
      // Table doesn't exist, create it
      if (error.name === 'ResourceNotFoundException') {
        await this.createTable();
      } else {
        this.logger.error('Error checking table existence:', error);
      }
    }
  }

  private async createTable() {
    try {
      const createCommand = new CreateTableCommand({
        TableName: NOTIFICATION_HISTORY_TABLE,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
          { AttributeName: 'timestamp', KeyType: 'RANGE' }, // Sort key
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'recipientType', AttributeType: 'S' },
          { AttributeName: 'recipient', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'RecipientTypeIndex',
            KeySchema: [
              { AttributeName: 'recipientType', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
          {
            IndexName: 'RecipientIndex',
            KeySchema: [
              { AttributeName: 'recipient', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });

      await this.client.send(createCommand);
      this.logger.log(
        `Table ${NOTIFICATION_HISTORY_TABLE} created successfully`,
      );
    } catch (error) {
      this.logger.error('Error creating table:', error);
      throw error;
    }
  }

  async saveNotification(
    notification: Omit<NotificationHistory, 'id' | 'timestamp' | 'createdAt'>,
  ): Promise<NotificationHistory> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const timestamp = Date.now();
    const createdAt = new Date().toISOString();

    console.log(`Saving notification: ${NOTIFICATION_HISTORY_TABLE}`);

    const item: NotificationHistory = {
      id,
      timestamp,
      createdAt,
      ...notification,
    };

    console.log('item:', item);

    const command = new PutCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      Item: item,
    });

    console.log('PutCommand:', command);

    try {
      await this.docClient.send(command);
      this.logger.debug(`Notification saved: ${id}`);
      console.log(`Notification saved: ${id}`);
    } catch (error) {
      console.error('Error saving notification:', error);
      throw error; // hoặc handle riêng nếu cần
    }

    return item;
  }

  async getNotificationsByRecipient(
    recipient: string,
    limit = 50,
  ): Promise<NotificationHistory[]> {
    const command = new QueryCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      IndexName: 'RecipientIndex',
      KeyConditionExpression: 'recipient = :recipient',
      ExpressionAttributeValues: {
        ':recipient': recipient,
      },
      ScanIndexForward: false, // Sort descending by timestamp
      Limit: limit,
    });

    const result = await this.docClient.send(command);
    return (result.Items as NotificationHistory[]) || [];
  }

  async getNotificationsByRecipientType(
    recipientType: 'user' | 'channel' | 'all',
    limit = 50,
  ): Promise<NotificationHistory[]> {
    const command = new QueryCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      IndexName: 'RecipientTypeIndex',
      KeyConditionExpression: 'recipientType = :recipientType',
      ExpressionAttributeValues: {
        ':recipientType': recipientType,
      },
      ScanIndexForward: false, // Sort descending by timestamp
      Limit: limit,
    });

    const result = await this.docClient.send(command);
    return (result.Items as NotificationHistory[]) || [];
  }

  async getAllNotifications(limit = 100): Promise<NotificationHistory[]> {
    const command = new ScanCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      Limit: limit,
    });

    const result = await this.docClient.send(command);
    return (result.Items as NotificationHistory[]) || [];
  }

  async getNotificationById(id: string): Promise<NotificationHistory | null> {
    const command = new QueryCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
      Limit: 1,
    });

    const result = await this.docClient.send(command);
    return result.Items?.[0] as NotificationHistory | null;
  }
}
