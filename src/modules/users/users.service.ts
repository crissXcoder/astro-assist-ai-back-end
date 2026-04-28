import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Address } from './entities/address.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_SEED_EMAIL', 'admin@astroassist.com');
      const adminPassword = this.configService.get<string>('ADMIN_SEED_PASSWORD', 'AstroAdmin123!');
      
      const existingAdmin = await this.userRepository.findOne({ where: { role: Role.ADMIN } });
      if (existingAdmin) {
        return; // Admin already exists
      }

      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const user = this.userRepository.create({
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
      });

      const savedUser = await this.userRepository.save(user);

      const profile = this.userProfileRepository.create({
        user: savedUser,
        cedula: '000000000',
        fullName: 'System Administrator',
        birthDate: new Date('2000-01-01'),
        phone: '00000000',
      });

      await this.userProfileRepository.save(profile);
      this.logger.log(`Admin seeded successfully with email: ${adminEmail}`);
    } catch (error) {
      this.logger.error('Failed to seed admin', error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['profile', 'addresses'] });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(userData: Partial<User>, profileData: Partial<UserProfile>): Promise<User> {
    if (!userData.email) {
      throw new ConflictException('Email is required');
    }
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }
    
    // Check if cedula exists
    const existingProfile = await this.userProfileRepository.findOne({ where: { cedula: profileData.cedula } });
    if (existingProfile) {
      throw new ConflictException('Cedula is already registered');
    }

    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = this.userRepository.create(userData);
      const savedUser = await queryRunner.manager.save(user);

      const profile = this.userProfileRepository.create({ ...profileData, user: savedUser });
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();
      return this.findById(savedUser.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
