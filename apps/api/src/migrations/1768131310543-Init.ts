import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768131310543 implements MigrationInterface {
    name = 'Init1768131310543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tenants\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(120) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_32731f181236a46182a38c992a\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stores\` (\`id\` varchar(36) NOT NULL, \`tenantId\` varchar(255) NOT NULL, \`name\` varchar(120) NOT NULL, \`address\` varchar(200) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6d5aa3f157c30f05d02bf844da\` (\`tenantId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`devices\` (\`id\` varchar(36) NOT NULL, \`tenantId\` varchar(255) NOT NULL, \`storeId\` varchar(255) NOT NULL, \`deviceCode\` varchar(40) NOT NULL, \`deviceKey\` varchar(80) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c94785ca96e82f719c64dd1c24\` (\`deviceKey\`), UNIQUE INDEX \`IDX_21bb97012eda1731a0be57b08b\` (\`tenantId\`, \`deviceCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`stores\` ADD CONSTRAINT \`FK_ebf3da4043eef0c65debcdf819a\` FOREIGN KEY (\`tenantId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`devices\` ADD CONSTRAINT \`FK_388a5c41555d999c9d80abd774e\` FOREIGN KEY (\`tenantId\`) REFERENCES \`tenants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`devices\` ADD CONSTRAINT \`FK_43306783f346bba53a6d4aa6c75\` FOREIGN KEY (\`storeId\`) REFERENCES \`stores\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`devices\` DROP FOREIGN KEY \`FK_43306783f346bba53a6d4aa6c75\``);
        await queryRunner.query(`ALTER TABLE \`devices\` DROP FOREIGN KEY \`FK_388a5c41555d999c9d80abd774e\``);
        await queryRunner.query(`ALTER TABLE \`stores\` DROP FOREIGN KEY \`FK_ebf3da4043eef0c65debcdf819a\``);
        await queryRunner.query(`DROP INDEX \`IDX_21bb97012eda1731a0be57b08b\` ON \`devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_c94785ca96e82f719c64dd1c24\` ON \`devices\``);
        await queryRunner.query(`DROP TABLE \`devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_6d5aa3f157c30f05d02bf844da\` ON \`stores\``);
        await queryRunner.query(`DROP TABLE \`stores\``);
        await queryRunner.query(`DROP INDEX \`IDX_32731f181236a46182a38c992a\` ON \`tenants\``);
        await queryRunner.query(`DROP TABLE \`tenants\``);
    }

}
