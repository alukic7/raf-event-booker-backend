import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Event } from '../event/event.entity'
import { User } from '../user/user.entity'

@Entity('rsvps')
@Unique(['event', 'user'])
export class Rsvp {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ nullable: false, type: 'timestamptz', name: 'rsvp_date' })
  rsvpDate: Date
}
