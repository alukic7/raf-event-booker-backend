import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import type { ReactionType } from '../comment/comment-likes.entity'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import { Event } from './event.entity'

@Entity('event_likes')
@Unique(['event', 'user'])
@Unique(['event', 'session'])
export class EventLikes {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Event, { nullable: false })
  event: Event

  @ManyToOne(() => User, { nullable: true })
  user: User | null

  @ManyToOne(() => Session, { nullable: true })
  session: Session | null

  @Column({ type: 'varchar', length: 10, nullable: false })
  type: ReactionType

  @CreateDateColumn()
  createdAt: Date
}
