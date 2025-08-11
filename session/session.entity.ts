import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../user/user.entity'

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_sessions_user_id')
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({
    name: 'created_at',
    nullable: false,
    type: 'timestamptz',
  })
  createdAt: Date

  @Column({ name: 'is_valid', default: true, nullable: false })
  isValid: boolean
}
