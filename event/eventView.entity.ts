import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Event } from '../event/event.entity'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'

@Entity('event_views')
@Unique(['event', 'user'])
@Unique(['event', 'session'])
export class EventView {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Event, event => event.views)
  event: Event

  @ManyToOne(() => User, { nullable: true })
  user: User | null

  @ManyToOne(() => Session, { nullable: true })
  session: Session | null

  @CreateDateColumn()
  viewedAt: Date
}
