import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('device_reset_audits')
export class DeviceResetAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid' })
  deviceId!: string;

  @Column({ type: 'uuid' })
  platformAdminId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
