import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TICKER$ } from './ticker.token';
import { interval } from 'rxjs';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    { provide: TICKER$, useFactory: () => interval(30_000) },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
