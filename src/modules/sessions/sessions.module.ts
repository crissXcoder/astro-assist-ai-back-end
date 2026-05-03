import { Module } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service.js';
import { SessionsController } from './sessions.controller.js';

@Module({
  providers: [SecurityEventsService],
  controllers: [SessionsController],
  exports: [SecurityEventsService],
})
export class SessionsModule {}
