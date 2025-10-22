import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { DynamoDBModule } from '@/database/dynamodb.module';

@Module({
  imports: [DynamoDBModule],
  providers: [NotificationGateway, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
