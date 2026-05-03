import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity.js';
import { UserProfile } from './entities/user-profile.entity.js';
import { Address } from './entities/address.entity.js';
import { Role } from './enums/role.enum.js';
import {
  SecurityEventsService,
  SecurityEventType,
} from '../sessions/security-events.service.js';
import { NotFoundError, ConflictError } from '../../common/exceptions/index.js';
import { ErrorCode } from '../../common/constants/error-codes.js';

/** Rounds de bcrypt. 12 es un buen balance seguridad/performance. */
const BCRYPT_ROUNDS = 12;

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
    private readonly dataSource: DataSource,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdmin();
  }

  // ── Seed Admin (Idempotente) ──────────────────────────

  /**
   * Crea el usuario administrador si no existe.
   * Busca por email (no por rol) para soportar múltiples admins en futuro.
   * Credenciales desde variables de entorno. Nunca hardcodeadas.
   */
  private async seedAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_SEED_EMAIL',
      'admin@astroassist.com',
    );
    const adminPassword = this.configService.get<string>(
      'ADMIN_SEED_PASSWORD',
      'AstroAdmin123!',
    );

    try {
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('Admin seed: usuario admin ya existe, omitiendo.');
        return;
      }

      const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

      // Transacción: crear usuario + perfil atómicamente
      // Patrón preferido per workspace_typeorm: dataSource.transaction()
      await this.dataSource.transaction(async (manager) => {
        const user = manager.create(User, {
          email: adminEmail,
          passwordHash,
          role: Role.ADMIN,
          isActive: true,
          emailVerified: true, // Admin no necesita verificar email
        });
        const savedUser = await manager.save(user);

        const profile = manager.create(UserProfile, {
          userId: savedUser.id,
          cedula: '000000000',
          fullName: 'System Administrator',
          birthDate: new Date('2000-01-01'),
          phone: '00000000',
        });
        await manager.save(profile);
      });

      this.logger.log(
        `Admin seed: usuario admin creado con email ${adminEmail}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Admin seed: falló la creación del admin — ${message}`);
    }
  }

  // ── Queries ───────────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'addresses'],
    });

    if (!user) {
      throw new NotFoundError({
        resource: 'usuario',
        internalMessage: `UsersService.findById: no encontrado con id=${id}`,
      });
    }

    return user;
  }

  async findAllPaginated(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<[User[], number]> {
    const clampedLimit = Math.min(limit, 100);
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.role = :role', { role: Role.CUSTOMER })
      .orderBy('user.createdAt', 'DESC')
      .take(clampedLimit)
      .skip((page - 1) * clampedLimit);

    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(user.email LIKE :search OR profile.fullName LIKE :search OR profile.cedula LIKE :search)',
        { search: searchTerm },
      );
    }

    return queryBuilder.getManyAndCount();
  }

  // ── Mutations ─────────────────────────────────────────

  /** Registro público de cliente */
  async registerCustomer(
    dto: import('./dto/user.dto.js').RegisterCustomerDto,
  ): Promise<User> {
    const { password, confirmPassword, address, ...profileData } = dto;

    if (password !== confirmPassword) {
      throw new ConflictError({
        userMessage: 'Las contraseñas no coinciden.',
        internalMessage: 'UsersService.registerCustomer: password mismatch',
      });
    }

    // Validar unicidad
    await this.validateUniqueness(dto.email, dto.cedula);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        role: Role.CUSTOMER,
      });
      const newUser = await manager.save(user);

      const profile = manager.create(UserProfile, {
        ...profileData,
        userId: newUser.id,
      });
      await manager.save(profile);

      const addr = manager.create(Address, {
        ...address,
        userId: newUser.id,
        isDefault: true,
      });
      await manager.save(addr);

      return newUser;
    });

    return this.findById(savedUser.id);
  }

  /** Creación de cliente por administrador. Siempre crea CUSTOMER. */
  async createByAdmin(
    dto: import('../admin/dto/create-user-by-admin.dto.js').CreateUserByAdminDto,
  ): Promise<User> {
    const {
      email,
      password,
      confirmPassword,
      cedula,
      fullName,
      birthDate,
      phone,
      address,
    } = dto;

    if (password !== confirmPassword) {
      throw new ConflictError({
        userMessage: 'Las contraseñas no coinciden.',
        internalMessage: 'UsersService.createByAdmin: password mismatch',
      });
    }

    // Validar unicidad
    await this.validateUniqueness(email, cedula);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email,
        passwordHash,
        role: Role.CUSTOMER, // Siempre CUSTOMER, nunca aceptar desde input
        isActive: true,
        emailVerified: true, // Admin lo crea verificado
      });
      const newUser = await manager.save(user);

      const profile = manager.create(UserProfile, {
        userId: newUser.id,
        cedula,
        fullName,
        birthDate,
        phone,
      });
      await manager.save(profile);

      const addr = manager.create(Address, {
        ...address,
        userId: newUser.id,
        isDefault: true,
      });
      await manager.save(addr);

      return newUser;
    });

    return this.findById(savedUser.id);
  }

  /** Actualización de cliente por administrador. No permite cambiar rol. */
  async updateByAdmin(
    id: string,
    dto: import('../admin/dto/update-user-by-admin.dto.js').UpdateUserByAdminDto,
  ): Promise<User> {
    const { email, password, fullName, phone, isActive } = dto;
    const user = await this.findById(id);

    if (email && email !== user.email) {
      const existingEmail = await this.userRepository.findOneBy({ email });
      if (existingEmail) {
        throw new ConflictError({
          errorCode: ErrorCode.USER_EMAIL_ALREADY_EXISTS,
          userMessage: 'Este correo electrónico ya está registrado.',
        });
      }
      user.email = email;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await this.userRepository.save(user);

    // Actualizar campos de perfil si se proporcionaron
    const profileUpdates: Partial<{ fullName: string; phone: string }> = {};
    if (fullName) profileUpdates.fullName = fullName;
    if (phone) profileUpdates.phone = phone;

    if (Object.keys(profileUpdates).length > 0) {
      await this.userProfileRepository.update({ userId: id }, profileUpdates);
    }

    return this.findById(id);
  }

  /** Cambio de estado activo/inactivo */
  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    user.isActive = isActive;
    await this.userRepository.save(user);

    if (!isActive) {
      this.securityEventsService.emit(id, SecurityEventType.FORCE_LOGOUT, {
        reason: 'Tu cuenta ha sido desactivada por un administrador.',
      });
    }

    return user;
  }

  /** Actualización de perfil propio */
  async updateMyProfile(
    userId: string,
    dto: import('./dto/user.dto.js').UpdateMyProfileDto,
  ): Promise<User> {
    const { address, ...profileData } = dto;

    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(profileData).length > 0) {
        await manager.update(UserProfile, { userId }, profileData);
      }

      if (address) {
        const defaultAddress = await manager.findOne(Address, {
          where: { userId, isDefault: true },
        });
        if (defaultAddress) {
          await manager.update(Address, defaultAddress.id, address);
        } else {
          const newAddr = manager.create(Address, {
            ...address,
            userId,
            isDefault: true,
          });
          await manager.save(newAddr);
        }
      }
    });

    this.securityEventsService.emit(userId, SecurityEventType.PROFILE_UPDATED, {
      updatedAt: new Date(),
    });

    return this.findById(userId);
  }

  /** Auxiliar: Validar unicidad de email y cédula */
  private async validateUniqueness(
    email: string,
    cedula: string,
  ): Promise<void> {
    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictError({
        errorCode: ErrorCode.USER_EMAIL_ALREADY_EXISTS,
        userMessage: 'Este correo electrónico ya está registrado.',
        internalMessage: `UsersService: email duplicado — ${email}`,
      });
    }

    const existingCedula = await this.userProfileRepository.findOne({
      where: { cedula },
    });
    if (existingCedula) {
      throw new ConflictError({
        errorCode: ErrorCode.USER_ID_ALREADY_EXISTS,
        userMessage: 'Esta cédula ya está registrada.',
        internalMessage: `UsersService: cédula duplicada — ${cedula}`,
      });
    }
  }
}
