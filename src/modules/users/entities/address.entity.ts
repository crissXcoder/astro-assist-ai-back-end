import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { User } from './user.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  province: string;

  @Column()
  canton: string;

  @Column()
  district: string;

  @Column()
  city: string;

  @Column()
  exactAddress: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ default: false })
  isDefault: boolean;
}
