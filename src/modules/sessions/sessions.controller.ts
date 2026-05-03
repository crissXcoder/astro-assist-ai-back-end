import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SecurityEventsService } from './security-events.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  /**
   * Canal SSE para eventos de seguridad y sesiones.
   * Requiere autenticación activa.
   */
  @UseGuards(JwtAuthGuard)
  @Sse('stream')
  stream(@CurrentUser() user: { id: string }): Observable<{ data: object; type: string }> {
    return this.securityEventsService.subscribeToUserEvents(user.id);
  }
}
