import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { NotificationGateway } from '../api/notification/notification.gateway';

interface TrafficReportPayload {
  reportId: string;
  incidentType:
    | 'accident'
    | 'congestion'
    | 'construction'
    | 'road_closure'
    | 'other';
  severity: 'low' | 'medium' | 'high';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  reporter: {
    userId?: string;
    username?: string;
  };
  timestamp: string;
  affectedUsers?: string[];
}

@Injectable()
export class TrafficReportConsumer implements OnModuleInit {
  private readonly logger = new Logger(TrafficReportConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaService.consume(
        'traffic-reports', // Kafka topic name
        'notification-service-group', // Consumer group ID
        async ({ message }) => {
          await this.handleTrafficReport(message.value.toString());
        },
      );
    } catch (error) {
      this.logger.error('Failed to start traffic report consumer', error);
    }
  }

  private async handleTrafficReport(messageValue: string) {
    try {
      const report: TrafficReportPayload = JSON.parse(messageValue);
      this.logger.log(`Processing traffic report: ${report.reportId}`);

      // Determine notification type based on severity
      const notificationType = this.getNotificationType(report.severity);
      const notificationTitle = this.getNotificationTitle(report.incidentType);

      // Create notification message
      const notification = {
        type: notificationType,
        title: notificationTitle,
        message: this.formatMessage(report),
        data: {
          reportId: report.reportId,
          incidentType: report.incidentType,
          severity: report.severity,
          location: report.location,
          timestamp: report.timestamp,
        },
      };

      // Send notification to all clients subscribed to traffic-alerts channel
      this.notificationGateway.sendNotificationToChannel(
        'traffic-alerts',
        notification,
      );
      this.logger.log(
        `Traffic notification sent for report: ${report.reportId}`,
      );

      // If there are specific affected users, send personalized notifications
      if (report.affectedUsers && report.affectedUsers.length > 0) {
        report.affectedUsers.forEach((userId) => {
          this.notificationGateway.sendNotificationToUser(userId, {
            ...notification,
            title: `${notificationTitle} on Your Route`,
            message: `${this.formatMessage(
              report,
            )} This may affect your current route.`,
          });
        });
        this.logger.log(
          `Sent personalized notifications to ${report.affectedUsers.length} users`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling traffic report', error);
    }
  }

  private getNotificationType(
    severity: string,
  ): 'info' | 'warning' | 'error' | 'success' {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  }

  private getNotificationTitle(incidentType: string): string {
    const titles = {
      accident: '🚗 Accident Reported',
      congestion: '🚦 Traffic Congestion',
      construction: '🚧 Road Construction',
      road_closure: '🚫 Road Closure',
      other: '⚠️ Traffic Alert',
    };
    return titles[incidentType] || titles.other;
  }

  private formatMessage(report: TrafficReportPayload): string {
    const location =
      report.location.address ||
      `${report.location.lat}, ${report.location.lng}`;
    return `${report.description} at ${location}`;
  }
}
