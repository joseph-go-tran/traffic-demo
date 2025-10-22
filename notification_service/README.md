<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Real-time notification service built with NestJS, WebSockets, and DynamoDB Local for notification history storage.

## Features

- Real-time WebSocket notifications
- DynamoDB Local for persistent notification history
- Support for broadcasting to all clients, specific users, or channels
- RESTful API for sending notifications and retrieving history
- Kafka integration for event-driven notifications

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- npm or yarn

## Installation

```bash
$ npm install
```

## Environment Setup

Copy the example environment file and configure it:

```bash
$ cp docker.env.example docker.env
```

Edit `docker.env` with your configuration:

```env
# DynamoDB Configuration
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local

# Kafka Configuration
KAFKA_BROKER=localhost:9092
```

## Running with Docker

Start all services (including DynamoDB Local):

```bash
$ docker-compose up -d
```

This will start:
- PostgreSQL database
- DynamoDB Local (port 8000)

## DynamoDB Local Setup

The DynamoDB table will be automatically created when the application starts. You can also manually initialize it:

```bash
$ node scripts/init-dynamodb.js
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Send Notifications

**Send to all clients:**
```bash
POST /notifications/send/all
Content-Type: application/json

{
  "type": "info",
  "title": "System Update",
  "message": "New features available",
  "data": {}
}
```

**Send to specific user:**
```bash
POST /notifications/send/user/:userId
Content-Type: application/json

{
  "type": "warning",
  "title": "Account Alert",
  "message": "Please verify your email"
}
```

**Send to channel:**
```bash
POST /notifications/send/channel/:channel
Content-Type: application/json

{
  "type": "success",
  "title": "Task Completed",
  "message": "Your export is ready"
}
```

### Retrieve Notification History

**Get all notifications:**
```bash
GET /notifications/history?limit=50
```

**Get notifications by recipient type:**
```bash
GET /notifications/history?recipientType=user&limit=50
GET /notifications/history?recipientType=channel&limit=50
GET /notifications/history?recipientType=all&limit=50
```

**Get notifications for specific recipient:**
```bash
GET /notifications/history/:recipient?limit=50
# Example: GET /notifications/history/user123?limit=20
```

**Get connection statistics:**
```bash
GET /notifications/stats
```

## WebSocket Connection

Connect to the WebSocket server:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to notification server');
});

socket.on('notification', (data) => {
  console.log('Received notification:', data);
  // { type, title, message, data, timestamp }
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});
```

### Join Channels

```javascript
socket.emit('join_channel', { channel: 'updates' });
socket.emit('leave_channel', { channel: 'updates' });
```

### Subscribe to User Notifications

```javascript
socket.emit('subscribe_user', { userId: 'user123' });
```

## DynamoDB Local Management

**Access DynamoDB Local shell:**
```bash
docker exec -it notification-dynamodb-local sh
```

**View DynamoDB data directory:**
```bash
ls -la /Users/admin/Desktop/gos-demo/notification_service/dynamodb-data
```

**Reset DynamoDB data:**
```bash
docker-compose down
rm -rf dynamodb-data
docker-compose up -d
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
