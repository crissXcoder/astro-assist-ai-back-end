import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Session } from '../entities/session.entity.js';

@Injectable()
export class SessionRepository extends Repository<Session> {
  constructor(private dataSource: DataSource) {
    super(Session, dataSource.createEntityManager());
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return this.find({
      where: { userId, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC' },
    });
  }

  async revokeSession(id: string): Promise<void> {
    await this.update({ id }, { revokedAt: new Date() });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Session | null> {
    return this.findOneBy({ id, userId });
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where(
        'userId = :userId AND id != :currentSessionId AND revokedAt IS NULL',
        {
          userId,
          currentSessionId,
        },
      )
      .execute();
  }
}
