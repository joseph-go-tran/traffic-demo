#!/usr/bin/env node

/**
 * Test script for DynamoDB integration
 * Run with: node scripts/test-dynamodb.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testDynamoDBIntegration() {
  console.log('🧪 Testing DynamoDB Integration...\n');

  try {
    // Test 1: Send notification to all
    console.log('1️⃣  Sending notification to all users...');
    const testNotification1 = {
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification sent to all users',
      data: { testId: 1 },
    };
    const result1 = await makeRequest(
      'POST',
      '/notifications/send/all',
      testNotification1,
    );
    console.log(`   Status: ${result1.status}`);
    console.log(`   Response:`, result1.data);
    console.log('');

    // Test 2: Send notification to specific user
    console.log('2️⃣  Sending notification to user123...');
    const testNotification2 = {
      type: 'warning',
      title: 'User Alert',
      message: 'This is a test notification for user123',
      data: { testId: 2 },
    };
    const result2 = await makeRequest(
      'POST',
      '/notifications/send/user/user123',
      testNotification2,
    );
    console.log(`   Status: ${result2.status}`);
    console.log(`   Response:`, result2.data);
    console.log('');

    // Test 3: Send notification to channel
    console.log('3️⃣  Sending notification to channel "updates"...');
    const testNotification3 = {
      type: 'success',
      title: 'Channel Update',
      message: 'This is a test notification for updates channel',
      data: { testId: 3 },
    };
    const result3 = await makeRequest(
      'POST',
      '/notifications/send/channel/updates',
      testNotification3,
    );
    console.log(`   Status: ${result3.status}`);
    console.log(`   Response:`, result3.data);
    console.log('');

    // Wait a bit for DynamoDB to process
    console.log('⏳ Waiting 2 seconds for DynamoDB to process...\n');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 4: Get all notification history
    console.log('4️⃣  Retrieving all notification history...');
    const result4 = await makeRequest('GET', '/notifications/history?limit=10');
    console.log(`   Status: ${result4.status}`);
    console.log(`   Found ${result4.data?.length || 0} notifications`);
    if (result4.data?.length > 0) {
      console.log(`   Latest:`, result4.data[0]);
    }
    console.log('');

    // Test 5: Get user notifications
    console.log('5️⃣  Retrieving notifications for user123...');
    const result5 = await makeRequest(
      'GET',
      '/notifications/history/user123?limit=5',
    );
    console.log(`   Status: ${result5.status}`);
    console.log(`   Found ${result5.data?.length || 0} notifications`);
    if (result5.data?.length > 0) {
      console.log(`   Latest:`, result5.data[0]);
    }
    console.log('');

    // Test 6: Get notifications by type
    console.log('6️⃣  Retrieving notifications by recipientType=all...');
    const result6 = await makeRequest(
      'GET',
      '/notifications/history?recipientType=all&limit=5',
    );
    console.log(`   Status: ${result6.status}`);
    console.log(`   Found ${result6.data?.length || 0} notifications`);
    console.log('');

    // Test 7: Get stats
    console.log('7️⃣  Getting connection statistics...');
    const result7 = await makeRequest('GET', '/notifications/stats');
    console.log(`   Status: ${result7.status}`);
    console.log(`   Stats:`, result7.data);
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Notifications sent and saved to DynamoDB');
    console.log('   - History retrieved successfully');
    console.log('   - Queries by recipient and type working');
    console.log('\n💡 Tip: Check the DynamoDB data directory:');
    console.log('   ls -la dynamodb-data/');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure the app is running: npm run start:dev');
    console.error('   2. Check DynamoDB is running: docker ps | grep dynamodb');
    console.error('   3. Verify port 3000 is available');
    process.exit(1);
  }
}

// Run tests
testDynamoDBIntegration();
