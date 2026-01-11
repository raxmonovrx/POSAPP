import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceTokenVersion1768136277000 implements MigrationInterface {
    name = 'AddDeviceTokenVersion1768136277000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`devices\` ADD \`tokenVersion\` int NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`devices\` ADD \`lastResetAt\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`devices\` DROP COLUMN \`lastResetAt\``);
        await queryRunner.query(`ALTER TABLE \`devices\` DROP COLUMN \`tokenVersion\``);
    }

}
