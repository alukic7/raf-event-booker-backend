import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../user/user.entity'

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

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
