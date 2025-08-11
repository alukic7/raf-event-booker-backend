import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Event } from '../event/event.entity'

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

  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event

  @Column({ nullable: false, name: 'like_count', default: 0 })
  likeCount: number

  @Column({ nullable: false, name: 'dislike_count', default: 0 })
  dislikeCount: number
}
