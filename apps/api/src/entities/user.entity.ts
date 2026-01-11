import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

export type UserRole = 'owner' | 'admin' | 'cashier';

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'varchar', length: 120 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'cashier'],
    default: 'cashier',
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
