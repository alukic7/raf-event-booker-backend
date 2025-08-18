import { AppDataSource } from '../config/data-source'
import { Event } from '../event/event.entity'
import { makeError } from '../lib/errors'
import { CommentLikes, type ReactionType } from './comment-likes.entity'
import { Comment } from './comment.entity'

export class CommentsService {
  commentsRepo = AppDataSource.getRepository(Comment)
  eventRepo = AppDataSource.getRepository(Event)

  async getAllComments(
    eventId: number,
    pageSize: number,
    offset: number
  ): Promise<{ data: Comment[]; total: number; page: number; pages: number }> {
    const allowedSizes = [10, 25, 50]

    if (
      !Number.isFinite(eventId) ||
      !Number.isFinite(pageSize) ||
      !Number.isFinite(offset)
    ) {
      throw makeError(
        'CommentError',
        400,
        'Event id, page size and offset are required'
      )
    }

    if (eventId < 1) {
      throw makeError('CommentError', 400, 'Event id must be a positive number')
    }

    if (!allowedSizes.includes(pageSize)) {
      throw makeError('CommentError', 400, 'This page size is not allowed')
    }

    const skip = Math.max(0, offset)

    const [comments, total] = await this.commentsRepo.findAndCount({
      where: { event: { id: eventId } },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: pageSize,
      skip: skip,
    })

    const page = Math.floor(skip / pageSize) + 1
    const pages = Math.max(1, Math.ceil(total / pageSize))

    return { data: comments, total, page, pages }
  }

  async createComment(authorName: string, content: string, eventId: number) {
    if (!authorName || !content || !eventId) {
      throw makeError(
        'CommentError',
        400,
        'Author name, content and event id are required'
      )
    }

    if (!Number.isFinite(eventId) || eventId <= 0)
      throw makeError('CommentError', 400, 'Event id is invalid')

    const event = await this.eventRepo.findOneBy({ id: eventId })
    if (!event)
      throw makeError('CommentError', 404, `There is event with id ${eventId}`)

    const newComment = this.commentsRepo.create({ authorName, content, event })
    await this.commentsRepo.save(newComment)

    return newComment
  }

  async reactOnComment(
    commentId: number,
    userId: number | null,
    sessionId: string,
    reactionType: string
  ) {
    if (!userId && !sessionId)
      throw makeError('CommentError', 400, 'Missing user or session identity')

    if (!reactionType)
      throw makeError('CommentError', 400, 'Missing reaction type')

    if (reactionType !== 'like' && reactionType !== 'dislike') {
      throw makeError('CommentError', 400, 'Invalid reaction type')
    }

    if (!commentId) throw makeError('CommentError', 400, 'Missing comment id')

    await AppDataSource.transaction(async manager => {
      const commentRepo = manager.getRepository(Comment)
      const commentLikesRepo = manager.getRepository(CommentLikes)

      const exists = await commentRepo.exist({ where: { id: commentId } })
      if (!exists) throw makeError('CommentError', 404, 'Comment not found')

      const identity = userId
        ? { user: { id: userId } }
        : { session: { id: sessionId! } }

      const existing = await commentLikesRepo.findOne({
        where: { comment: { id: commentId }, ...identity },
      })

      if (existing) {
        if (existing.type === reactionType) return

        await commentLikesRepo.delete({ id: existing.id })

        const opposite = existing.type === 'like' ? 'likeCount' : 'dislikeCount'
        await commentRepo.decrement({ id: commentId }, opposite, 1)
      }

      await commentLikesRepo.insert({
        comment: { id: commentId } as any,
        ...identity,
        type: reactionType as ReactionType,
      })

      const target = reactionType === 'like' ? 'likeCount' : 'dislikeCount'
      await commentRepo.increment({ id: commentId }, target, 1)
    })
  }
}
