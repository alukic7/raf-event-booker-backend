import { AppDataSource } from '../config/data-source'
import { Event } from '../event/event.entity'
import { makeError } from '../lib/errors'
import { Comment } from './comment.entity'

export class CommentsService {
  commentsRepo = AppDataSource.getRepository(Comment)
  eventRepo = AppDataSource.getRepository(Event)

  async getAllComments(eventId: number): Promise<Comment[]> {
    if (!eventId) throw new Error('Event ID is required to retrieve comments')

    return this.commentsRepo.find({
      where: { event: { id: eventId } },
      order: { createdAt: 'DESC' },
    })
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
}
