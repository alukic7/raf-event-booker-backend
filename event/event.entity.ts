import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'timestamptz', nullable: false, name: 'event_date' })
  eventDate: Date

  @Column({ nullable: false, length: 255 })
  location: string

  @Column({ default: 0 })
  views: number

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

  @ManyToOne(() => Category, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category

  @Column({ nullable: true, name: 'max_participants' })
  maxParticipants: number
}
