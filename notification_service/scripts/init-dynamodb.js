#!/usr/bin/env node

/**
 * Script to initialize DynamoDB Local tables
 * Run with: node scripts/init-dynamodb.js
 */

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');

const NOTIFICATION_HISTORY_TABLE = 'NotificationHistory';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
});

async function initializeTable() {
  try {
    // Check if table exists
    const describeCommand = new DescribeTableCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
    });

    await client.send(describeCommand);
    console.log(`✓ Table ${NOTIFICATION_HISTORY_TABLE} already exists`);
  } catch (error) {
    // Table doesn't exist, create it
    if (error.name === 'ResourceNotFoundException') {
      await createTable();
    } else {
      console.error('Error checking table existence:', error);
      process.exit(1);
    }
  }
}

async function createTable() {
  try {
    const createCommand = new CreateTableCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
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

    await client.send(createCommand);
    console.log(`✓ Table ${NOTIFICATION_HISTORY_TABLE} created successfully`);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeTable()
  .then(() => {
    console.log('DynamoDB initialization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('DynamoDB initialization failed:', error);
    process.exit(1);
  });
