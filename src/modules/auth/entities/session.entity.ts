import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  refreshTokenHash: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  ipHash?: string;

  @Column({ default: false })
  isRevoked: boolean;
}
