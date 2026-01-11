import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreEntity } from './store.entity';
import { TenantEntity } from './tenant.entity';

@Entity('devices')
@Index(['tenantId', 'deviceCode'], { unique: true })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => StoreEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: StoreEntity;

  // Kassadagi “POS-01” kabi kod
  @Column({ type: 'varchar', length: 40 })
  deviceCode!: string;

  // Sync / auth uchun (hash saqlanadi)
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  deviceKeyHash!: string;

  @Column({ type: 'int', default: 1 })
  tokenVersion!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastResetAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt?: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
