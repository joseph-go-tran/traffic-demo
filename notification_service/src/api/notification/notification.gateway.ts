import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface NotificationPayload {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  timestamp?: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private connectedClients = new Map<string, Socket>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, client);
    this.logger.log(
      `Client connected: ${clientId} - Total clients: ${this.connectedClients.size}`,
    );

    // Send welcome notification
    client.emit('notification', {
      type: 'success',
      title: 'Connected',
      message: 'Successfully connected to notification service',
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);
    this.logger.log(
      `Client disconnected: ${clientId} - Total clients: ${this.connectedClients.size}`,
    );
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; channels?: string[] },
  ) {
    const { userId, channels = [] } = data;

    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} subscribed to user:${userId}`);
    }

    channels.forEach((channel) => {
      client.join(channel);
      this.logger.log(`Client ${client.id} subscribed to channel:${channel}`);
    });

    return {
      success: true,
      message: 'Subscribed successfully',
      subscribedTo: {
        userId,
        channels,
      },
    };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; channels?: string[] },
  ) {
    const { userId, channels = [] } = data;

    if (userId) {
      client.leave(`user:${userId}`);
      this.logger.log(`Client ${client.id} unsubscribed from user:${userId}`);
    }

    channels.forEach((channel) => {
      client.leave(channel);
      this.logger.log(
        `Client ${client.id} unsubscribed from channel:${channel}`,
      );
    });

    return {
      success: true,
      message: 'Unsubscribed successfully',
    };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: { timestamp: Date.now() },
    };
  }

  // Public methods to send notifications
  sendNotificationToAll(payload: NotificationPayload) {
    const notification = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };
    this.server.emit('notification', notification);
    this.logger.log(`Broadcast notification to all clients: ${payload.title}`);
  }

  sendNotificationToUser(userId: string, payload: NotificationPayload) {
    const notification = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Sent notification to user ${userId}: ${payload.title}`);
  }

  sendNotificationToChannel(channel: string, payload: NotificationPayload) {
    const notification = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };
    this.server.to(channel).emit('notification', notification);
    this.logger.log(
      `Sent notification to channel ${channel}: ${payload.title}`,
    );
  }

  sendNotificationToClient(clientId: string, payload: NotificationPayload) {
    const notification = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };
    this.server.to(clientId).emit('notification', notification);
    this.logger.log(
      `Sent notification to client ${clientId}: ${payload.title}`,
    );
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId);
  }
}
