import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Category } from '../category/category.entity'
import { Tag } from '../tag/tag.entity'
import { User } from '../user/user.entity'

@Check(`"max_participants" IS NULL OR "max_participants" > 0`)
@Check(`"views" >= 0`)
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false, length: 255 })
  name: string

  @Column({ nullable: false, type: 'text' })
  description: string

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    nullable: false,
  })
  createdAt: Date

  @Index('idx_events_event_date')
  @Column({ type: 'timestamptz', nullable: false, name: 'event_date' })
  eventDate: Date

  @Column({ nullable: false, length: 255 })
  location: string

  @Column({ nullable: false, type: 'int', default: 0 })
  views: number

  @Index('idx_events_author_id')
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'event_tags',
    joinColumn: { name: 'event_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[]

  @Index('idx_events_category_id')
  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category

  @Column({ type: 'int', nullable: true, name: 'max_participants' })
  maxParticipants: number | null
}
