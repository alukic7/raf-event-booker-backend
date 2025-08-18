import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import { Comment } from './comment.entity'

export type ReactionType = 'like' | 'dislike'

@Entity('comment_likes')
@Unique(['comment', 'user'])
@Unique(['comment', 'session'])
export class CommentLikes {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Comment, { nullable: false })
  comment: Comment

  @ManyToOne(() => User, { nullable: true })
  user: User | null

  @ManyToOne(() => Session, { nullable: true })
  session: Session | null

  @Column({ type: 'varchar', length: 10, nullable: false })
  type: ReactionType

  @CreateDateColumn()
  createdAt: Date
}
