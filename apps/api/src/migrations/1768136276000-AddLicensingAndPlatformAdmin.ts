import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLicensingAndPlatformAdmin1768136276000 implements MigrationInterface {
    name = 'AddLicensingAndPlatformAdmin1768136276000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tenants\` ADD \`maxDevices\` int NOT NULL DEFAULT 1`);
        await queryRunner.query(`CREATE TABLE \`platform_admins\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(120) NOT NULL, \`passwordHash\` varchar(120) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_42723222f5a9f48b2406a8f8a8\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_42723222f5a9f48b2406a8f8a8\` ON \`platform_admins\``);
        await queryRunner.query(`DROP TABLE \`platform_admins\``);
        await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`maxDevices\``);
    }

}
