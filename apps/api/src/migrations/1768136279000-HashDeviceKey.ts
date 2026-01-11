import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class HashDeviceKey1768136279000 implements MigrationInterface {
  name = 'HashDeviceKey1768136279000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');
    if (!table) return;

    const legacyKeyCol = table.findColumnByName('deviceKey');
    const legacyIdx = table.indices.find((i) => i.columnNames.includes('deviceKey'));
    if (legacyIdx) {
      await queryRunner.dropIndex(table, legacyIdx);
    }
    if (legacyKeyCol) {
      await queryRunner.dropColumn(table, legacyKeyCol);
    }

    const hashCol = table.findColumnByName('deviceKeyHash');
    if (!hashCol) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'deviceKeyHash',
          type: 'varchar',
          length: '128',
          isNullable: false,
        }),
      );
    }

    const hasHashIndex = table.indices.some((i) =>
      i.columnNames.includes('deviceKeyHash'),
    );
    if (!hasHashIndex) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: 'IDX_device_key_hash_unique',
          columnNames: ['deviceKeyHash'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('devices');
    if (!table) return;

    const hashIdx = table.indices.find((i) =>
      i.columnNames.includes('deviceKeyHash'),
    );
    if (hashIdx) {
      await queryRunner.dropIndex(table, hashIdx);
    }

    const hashCol = table.findColumnByName('deviceKeyHash');
    if (hashCol) {
      await queryRunner.dropColumn(table, hashCol);
    }

    const legacyCol = table.findColumnByName('deviceKey');
    if (!legacyCol) {
      await queryRunner.addColumn(table, {
        name: 'deviceKey',
        type: 'varchar',
        length: '80',
        isNullable: false,
      } as any);
    }

    const hasLegacyIdx = table.indices.some((i) =>
      i.columnNames.includes('deviceKey'),
    );
    if (!hasLegacyIdx) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: 'IDX_c94785ca96e82f719c64dd1c24',
          columnNames: ['deviceKey'],
          isUnique: true,
        }),
      );
    }
  }
}
