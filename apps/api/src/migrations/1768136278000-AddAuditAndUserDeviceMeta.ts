import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditAndUserDeviceMeta1768136278000 implements MigrationInterface {
    name = 'AddAuditAndUserDeviceMeta1768136278000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`devices\` ADD \`lastSeenAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`lastLoginAt\` timestamp NULL`);
        await queryRunner.query(`
          CREATE TABLE \`device_reset_audits\` (
            \`id\` varchar(36) NOT NULL,
            \`tenantId\` varchar(255) NOT NULL,
            \`deviceId\` varchar(255) NOT NULL,
            \`platformAdminId\` varchar(255) NOT NULL,
            \`reason\` varchar(255) NULL,
            \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (\`id\`),
            INDEX \`IDX_device_reset_tenant\` (\`tenantId\`),
            INDEX \`IDX_device_reset_device\` (\`deviceId\`)
          ) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`device_reset_audits\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastLoginAt\``);
        await queryRunner.query(`ALTER TABLE \`devices\` DROP COLUMN \`lastSeenAt\``);
    }

}
