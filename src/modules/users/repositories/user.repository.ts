import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { Role } from '../enums/role.enum.js';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByIdWithProfile(id: string): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: ['profile', 'addresses'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Query builder base para clientes (no admins).
   */
  getCustomersQueryBuilder(): SelectQueryBuilder<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.role = :role', { role: Role.CUSTOMER });
  }

  /**
   * Busca usuarios paginados con búsqueda.
   */
  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[User[], number]> {
    const queryBuilder = this.getCustomersQueryBuilder()
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(user.email LIKE :search OR profile.fullName LIKE :search OR profile.cedula LIKE :search)',
        { search: searchTerm },
      );
    }

    return queryBuilder.getManyAndCount();
  }
}
