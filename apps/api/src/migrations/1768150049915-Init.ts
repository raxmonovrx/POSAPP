import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768150049915 implements MigrationInterface {
    name = 'Init1768150049915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_device_reset_device\` ON \`device_reset_audits\``);
        await queryRunner.query(`DROP INDEX \`IDX_device_reset_tenant\` ON \`device_reset_audits\``);
        await queryRunner.query(`ALTER TABLE \`devices\` ADD UNIQUE INDEX \`IDX_bf3ead0737e9e8ba7639c7f47f\` (\`deviceKeyHash\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_af2fcb1549ba894d33e88cc717\` ON \`device_reset_audits\` (\`tenantId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_93db495e939ed572e58273a431\` ON \`device_reset_audits\` (\`deviceId\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_93db495e939ed572e58273a431\` ON \`device_reset_audits\``);
        await queryRunner.query(`DROP INDEX \`IDX_af2fcb1549ba894d33e88cc717\` ON \`device_reset_audits\``);
        await queryRunner.query(`ALTER TABLE \`devices\` DROP INDEX \`IDX_bf3ead0737e9e8ba7639c7f47f\``);
        await queryRunner.query(`CREATE INDEX \`IDX_device_reset_tenant\` ON \`device_reset_audits\` (\`tenantId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_device_reset_device\` ON \`device_reset_audits\` (\`deviceId\`)`);
    }

}
