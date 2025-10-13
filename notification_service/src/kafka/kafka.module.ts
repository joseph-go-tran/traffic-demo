import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { TrafficReportConsumer } from './traffic-report.consumer';
import { NotificationModule } from '../api/notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [KafkaService, TrafficReportConsumer],
  exports: [KafkaService],
})
export class KafkaModule {}
