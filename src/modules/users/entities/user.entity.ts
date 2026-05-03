import { Entity, Column, Index, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity.js';
import { Role } from '../enums/role.enum.js';
import { UserProfile } from './user-profile.entity.js';
import { Address } from './address.entity.js';
import { Session } from '../../auth/entities/session.entity.js';

@Entity('users')
export class User extends BaseEntity {
  @Index('IDX_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role!: Role;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  isActive!: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  lastLoginAt!: Date | null;

  // ── Relaciones ──────────────────────────────────────

  /** 1:1 → UserProfile. Cascade solo insert (crear perfil junto con usuario). */
  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: ['insert'],
  })
  profile!: UserProfile;

  /** 1:N → Address. Cascade solo insert (crear direcciones desde registro). */
  @OneToMany(() => Address, (address) => address.user, {
    cascade: ['insert'],
  })
  addresses!: Address[];

  /** 1:N → Session. Sin cascade (sesiones se gestionan independientemente). */
  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
