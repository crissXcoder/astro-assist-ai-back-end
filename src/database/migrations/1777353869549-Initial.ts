import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1777353869549 implements MigrationInterface {
  name = 'Initial1777353869549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`userId\` varchar(255) NOT NULL, \`refreshTokenHash\` varchar(255) NOT NULL, \`expiresAt\` datetime NOT NULL, \`userAgent\` varchar(255) NULL, \`ipHash\` varchar(255) NULL, \`isRevoked\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`email\` varchar(255) NOT NULL, \`passwordHash\` varchar(255) NOT NULL, \`role\` enum ('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER', \`isActive\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`postalCode\` \`postalCode\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_95c93a584de49f0b0e13f753630\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_57de40bc620f456c7311aa3a1e6\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` ADD CONSTRAINT \`FK_8481388d6325e752cd4d7e26c6d\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` DROP FOREIGN KEY \`FK_8481388d6325e752cd4d7e26c6d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_57de40bc620f456c7311aa3a1e6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_95c93a584de49f0b0e13f753630\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`postalCode\` \`postalCode\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`sessions\``);
  }
}
