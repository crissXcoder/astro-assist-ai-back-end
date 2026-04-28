import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1777353999290 implements MigrationInterface {
  name = 'Init1777353999290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`postalCode\` \`postalCode\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`userAgent\` \`userAgent\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`ipHash\` \`ipHash\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`ipHash\` \`ipHash\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`userAgent\` \`userAgent\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`postalCode\` \`postalCode\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profiles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`,
    );
  }
}
