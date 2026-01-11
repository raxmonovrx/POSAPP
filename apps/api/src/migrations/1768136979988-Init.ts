import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768136979988 implements MigrationInterface {
    name = 'Init1768136979988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_42723222f5a9f48b2406a8f8a8\` ON \`platform_admins\``);
        await queryRunner.query(`ALTER TABLE \`platform_admins\` ADD UNIQUE INDEX \`IDX_7ddfa7abfaf477f671ccc566c8\` (\`email\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`platform_admins\` DROP INDEX \`IDX_7ddfa7abfaf477f671ccc566c8\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_42723222f5a9f48b2406a8f8a8\` ON \`platform_admins\` (\`email\`)`);
    }

}
