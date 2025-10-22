import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { DynamoDBService } from '@/database/dynamodb.service';

interface SendNotificationDto {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly dynamoDBService: DynamoDBService,
  ) {}

  async sendToAll(notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToAll(notification);

    // Save to DynamoDB
    await this.dynamoDBService.saveNotification({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      recipient: 'all',
      recipientType: 'all',
    });

    return { success: true, message: 'Notification sent to all clients' };
  }

  async sendToUser(userId: string, notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToUser(userId, notification);

    // Save to DynamoDB
    await this.dynamoDBService.saveNotification({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      recipient: userId,
      recipientType: 'user',
    });

    return { success: true, message: `Notification sent to user ${userId}` };
  }

  async sendToChannel(channel: string, notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToChannel(channel, notification);

    // Save to DynamoDB
    await this.dynamoDBService.saveNotification({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      recipient: channel,
      recipientType: 'channel',
    });

    return {
      success: true,
      message: `Notification sent to channel ${channel}`,
    };
  }

  async getHistory(
    recipientType?: 'user' | 'channel' | 'all',
    recipient?: string,
    limit = 50,
  ) {
    if (recipient) {
      return await this.dynamoDBService.getNotificationsByRecipient(
        recipient,
        limit,
      );
    }

    if (recipientType) {
      return await this.dynamoDBService.getNotificationsByRecipientType(
        recipientType,
        limit,
      );
    }

    return await this.dynamoDBService.getAllNotifications(limit);
  }

  getStats() {
    return {
      connectedClients: this.notificationGateway.getConnectedClientsCount(),
    };
  }
}
