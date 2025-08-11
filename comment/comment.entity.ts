import {
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

@Check(`"like_count" >= 0 AND "dislike_count" >= 0`)
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false, name: 'author_name' })
  authorName: string

  @Column({ nullable: false, type: 'text' })
  content: string

  @CreateDateColumn({
    nullable: false,
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date

  @Index('idx_comments_event_id')
  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event

  @Index('idx_comments_user_id')
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ nullable: false, name: 'like_count', default: 0 })
  likeCount: number

  @Column({ nullable: false, name: 'dislike_count', default: 0 })
  dislikeCount: number
}
