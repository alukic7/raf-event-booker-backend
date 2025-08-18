import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import { Event } from './event.entity'

@Entity('event_views')
@Unique(['event', 'user'])
@Unique(['event', 'session'])
export class EventView {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Event, { nullable: false })
  event: Event

  @ManyToOne(() => User, { nullable: true })
  user: User | null

  @ManyToOne(() => Session, { nullable: true })
  session: Session | null

  @CreateDateColumn()
  viewedAt: Date
}
