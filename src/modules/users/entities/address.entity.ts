import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity.js';
import { User } from './user.entity.js';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  province!: string;

  @Column({ type: 'varchar', length: 100 })
  canton!: string;

  @Column({ type: 'varchar', length: 100 })
  district!: string;

  @Column({ type: 'varchar', length: 100 })
  town!: string;

  @Column({ type: 'text' })
  exactAddress!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, default: 'Costa Rica' })
  country!: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isDefault!: boolean;
}
