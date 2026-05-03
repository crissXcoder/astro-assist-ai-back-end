import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export enum SecurityEventType {
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSIONS_UPDATED = 'SESSIONS_UPDATED',
  FORCE_LOGOUT = 'FORCE_LOGOUT',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
}

export interface SecurityEventPayload {
  [SecurityEventType.SESSION_REVOKED]: { sessionId: string };
  [SecurityEventType.SESSIONS_UPDATED]: { action: 'REVOKED_OTHERS' | 'LOGOUT' };
  [SecurityEventType.FORCE_LOGOUT]: { reason: string };
  [SecurityEventType.PROFILE_UPDATED]: { updatedAt: Date };
}

export interface SecurityEvent<
  T extends SecurityEventType = SecurityEventType,
> {
  userId: string;
  type: T;
  payload: SecurityEventPayload[T];
}

@Injectable()
export class SecurityEventsService {
  private readonly eventSubject = new Subject<SecurityEvent>();

  /**
   * Emite un evento de seguridad para un usuario específico.
   */
  emit<T extends SecurityEventType>(
    userId: string,
    type: T,
    payload: SecurityEventPayload[T],
  ): void {
    this.eventSubject.next({ userId, type, payload });
  }

  /**
   * Retorna un observable filtrado por el ID del usuario.
   * Transforma el evento interno al formato esperado por SSE (MessageEvent).
   */
  subscribeToUserEvents(
    userId: string,
  ): Observable<{ data: object; type: string }> {
    return this.eventSubject.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: event.payload,
        type: event.type,
      })),
    );
  }
}
