import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768132257451 implements MigrationInterface {
    name = 'Init1768132257451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`tenantId\` varchar(255) NOT NULL, \`email\` varchar(120) NOT NULL, \`passwordHash\` varchar(120) NOT NULL, \`role\` enum ('owner', 'admin', 'cashier') NOT NULL DEFAULT 'cashier', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7346b08032078107fce81e014f\` (\`tenantId\`, \`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_c58f7e88c286e5e3478960a998b\` FOREIGN KEY (\`tenantId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_c58f7e88c286e5e3478960a998b\``);
        await queryRunner.query(`DROP INDEX \`IDX_7346b08032078107fce81e014f\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
