import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send/all')
  sendToAll(
    @Body()
    body: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      data?: any;
    },
  ) {
    return this.notificationService.sendToAll(body);
  }

  @Post('send/user/:userId')
  sendToUser(
    @Param('userId') userId: string,
    @Body()
    body: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      data?: any;
    },
  ) {
    return this.notificationService.sendToUser(userId, body);
  }

  @Post('send/channel/:channel')
  sendToChannel(
    @Param('channel') channel: string,
    @Body()
    body: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      data?: any;
    },
  ) {
    return this.notificationService.sendToChannel(channel, body);
  }

  @Get('stats')
  getStats() {
    return this.notificationService.getStats();
  }

  @Get('history')
  async getHistory(
    @Query('recipientType') recipientType?: 'user' | 'channel' | 'all',
    @Query('recipient') recipient?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.getHistory(
      recipientType,
      recipient,
      limitNumber,
    );
  }

  @Get('history/:recipient')
  async getHistoryByRecipient(
    @Param('recipient') recipient: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.getHistory(
      undefined,
      recipient,
      limitNumber,
    );
  }
}
