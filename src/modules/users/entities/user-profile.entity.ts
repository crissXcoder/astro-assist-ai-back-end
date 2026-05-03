import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity.js';
import { User } from './user.entity.js';

@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 20, unique: true })
  cedula!: string;

  @Column({ type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'date' })
  birthDate!: Date;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;
}
