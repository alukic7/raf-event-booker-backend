import {
  BeforeInsert,
  BeforeUpdate,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Event } from '../event/event.entity'
import { User } from '../user/user.entity'

@Entity('rsvps')
@Check(
  `(("user_id" IS NOT NULL AND "email" IS NULL) OR ("user_id" IS NULL AND "email" IS NOT NULL))`
)
@Index('idx_rsvps_event_id', ['event'])
@Index('uniq_rsvp_event_user', ['event', 'user'], {
  unique: true,
  where: `"user_id" IS NOT NULL`,
})
@Index('uniq_rsvp_event_email', ['event', 'email'], {
  unique: true,
  where: `"email" IS NOT NULL`,
})
export class Rsvp {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null

  @Column({ name: 'email', type: 'varchar', length: 320, nullable: true })
  email: string | null

  @CreateDateColumn({ name: 'rsvp_date', type: 'timestamptz', nullable: false })
  rsvpDate: Date

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email != null) {
      const trimmed = this.email.trim()
      this.email = trimmed ? trimmed.toLowerCase() : null
    }
  }
}
