import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity.js';

@Injectable()
export class UserProfileRepository extends Repository<UserProfile> {
  constructor(private dataSource: DataSource) {
    super(UserProfile, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.findOne({ where: { userId } });
  }

  async findByCedula(cedula: string): Promise<UserProfile | null> {
    return this.findOne({ where: { cedula } });
  }
}
