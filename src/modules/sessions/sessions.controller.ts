import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SecurityEventsService } from './security-events.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  /**
   * Canal SSE para eventos de seguridad y sesiones.
   * Requiere autenticación activa.
   */
  @Sse('stream')
  stream(
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<{ data: object; type: string }> {
    return this.securityEventsService.subscribeToUserEvents(user.id);
  }
}
