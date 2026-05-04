import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Address } from '../entities/address.entity.js';

@Injectable()
export class AddressRepository extends Repository<Address> {
  constructor(private dataSource: DataSource) {
    super(Address, dataSource.createEntityManager());
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    return this.findOne({ where: { userId, isDefault: true } });
  }

  async findAllByUserId(userId: string): Promise<Address[]> {
    return this.find({ where: { userId } });
  }
}
