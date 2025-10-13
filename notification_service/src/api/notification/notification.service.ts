import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

interface SendNotificationDto {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class NotificationService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  sendToAll(notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToAll(notification);
    return { success: true, message: 'Notification sent to all clients' };
  }

  sendToUser(userId: string, notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToUser(userId, notification);
    return { success: true, message: `Notification sent to user ${userId}` };
  }

  sendToChannel(channel: string, notification: SendNotificationDto) {
    this.notificationGateway.sendNotificationToChannel(channel, notification);
    return {
      success: true,
      message: `Notification sent to channel ${channel}`,
    };
  }

  getStats() {
    return {
      connectedClients: this.notificationGateway.getConnectedClientsCount(),
    };
  }
}
