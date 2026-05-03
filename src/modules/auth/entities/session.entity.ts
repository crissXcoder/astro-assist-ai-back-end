import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('sessions')
@Index('IDX_sessions_userId_revokedAt', ['userId', 'revokedAt'])
@Index('IDX_sessions_expiresAt', ['expiresAt'])
export class Session extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  refreshTokenHash!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  /** IP del cliente. IPv6 max 45 chars. */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /** Timestamp de revocación. null = sesión activa. */
  @Column({ type: 'timestamp', nullable: true, default: null })
  revokedAt!: Date | null;

  /** Último uso del refresh token. */
  @Column({ type: 'timestamp', nullable: true, default: null })
  lastUsedAt!: Date | null;
}
