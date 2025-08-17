import { Category } from '../category/category.entity'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Session } from '../session/session.entity'
import { Tag } from '../tag/tag.entity'
import { User } from '../user/user.entity'
import { Event } from './event.entity'
import { EventView } from './eventView.entity'

export class EventService {
  private eventRepository = AppDataSource.getRepository(Event)
  private viewRepository = AppDataSource.getRepository(EventView)
  private sessionRepository = AppDataSource.getRepository(Session)

  async getAllEvents(
    pageSize: number,
    offset: number
  ): Promise<{ data: Event[]; total: number; page: number; pages: number }> {
    const allowedSizes = [10, 25, 50]

    if (!Number.isFinite(pageSize) || !Number.isFinite(offset)) {
      throw makeError('EventError', 400, 'Page size and offset are required')
    }

    if (!allowedSizes.includes(pageSize)) {
      throw makeError('EventError', 400, 'This page size is not allowed')
    }

    const skip = Math.max(0, offset)

    const [events, total] = await this.eventRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: { author: true },
      take: pageSize,
      skip: skip,
    })

    const page = Math.floor(skip / pageSize) + 1
    const pages = Math.max(1, Math.ceil(total / pageSize))

    return { data: events, total, page, pages }
  }

  async getTheMostViewed(): Promise<Event[]> {
    const events = await this.eventRepository.find({
      order: { views: 'DESC' },
      take: 10,
      skip: 0,
    })

    if (!events) makeError('EventError', 404, 'There are no events yet')

    return events
  }

  async getEventsByCategory(
    categoryId: number,
    pageSize: number,
    offset: number
  ): Promise<{ data: Event[]; total: number; page: number; pages: number }> {
    const allowedSizes = [10, 25, 50]

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw makeError('EventError', 400, 'Valid category id is required')
    }
    if (!Number.isFinite(pageSize) || !Number.isFinite(offset)) {
      throw makeError('EventError', 400, 'Page size and offset are required')
    }
    if (!allowedSizes.includes(pageSize)) {
      throw makeError('EventError', 400, 'This page size is not allowed')
    }

    const skip = Math.max(0, offset)

    const [events, total] = await this.eventRepository.findAndCount({
      where: { category: { id: categoryId } },
      order: { createdAt: 'DESC' },
      relations: { author: true, category: true },
      take: pageSize,
      skip,
    })

    const page = Math.floor(skip / pageSize) + 1
    const pages = Math.max(1, Math.ceil(total / pageSize))
    return { data: events, total, page, pages }
  }

  async getEventById(id: number): Promise<Event> {
    if (!id) throw makeError('EventError', 400, 'Event id is required')

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { author: true, category: true, tags: true },
    })

    if (!event)
      throw makeError('EventError', 404, `Event with id ${id} not found`)

    return event
  }

  async increaseViewCount(
    eventId: number,
    userId: number | null,
    sessionId: string | null
  ) {
    return await AppDataSource.transaction(async manager => {
      const event = await manager.findOne(Event, { where: { id: eventId } })
      if (!event) throw makeError('EventError', 404, 'Event not found')

      const existing = await manager.findOne(EventView, {
        where: [
          userId
            ? { event: { id: eventId }, user: { id: userId } }
            : { event: { id: eventId }, session: { id: sessionId! } },
        ],
      })

      if (existing) return event

      const view = manager.create(EventView, {
        event,
        user: userId ? ({ id: userId } as User) : null,
        session: !userId && sessionId ? ({ id: sessionId } as Session) : null,
      })
      await manager.save(EventView, view)

      event.views += 1
      return await manager.save(Event, event)
    })
  }

  async createEvent(
    name: string,
    description: string,
    eventDate: Date,
    location: string,
    categoryId: number,
    authorId: number,
    tags: string[],
    maxParticipants?: number
  ): Promise<Event> {
    const n = name?.trim()
    const d = description?.trim()
    const loc = location?.trim()
    const mp = maxParticipants == null ? null : maxParticipants

    if (!n || !d || !eventDate || !loc || !Array.isArray(tags)) {
      throw makeError('EventError', 400, 'Missing required fields')
    }
    if (mp != null && mp <= 0) {
      throw makeError('EventError', 400, 'Max participants must be > 0')
    }

    const tagNames = Array.from(
      new Set(tags.map(t => t?.trim()).filter(Boolean))
    )
    if (tagNames.length === 0) {
      throw makeError('EventError', 400, 'At least one tag is required')
    }

    return AppDataSource.transaction(async manager => {
      const catRepo = manager.getRepository(Category)
      const usrRepo = manager.getRepository(User)
      const tagRepo = manager.getRepository(Tag)
      const evtRepo = manager.getRepository(Event)

      const [category, author] = await Promise.all([
        catRepo.findOneBy({ id: categoryId }),
        usrRepo.findOneBy({ id: authorId }),
      ])

      if (!category)
        throw makeError('EventError', 404, `Category ${categoryId} not found`)
      if (!author)
        throw makeError('EventError', 404, `Author ${authorId} not found`)

      const existing = await tagRepo
        .createQueryBuilder('t')
        .where('t.name IN (:...names)', { names: tagNames })
        .getMany()

      const have = new Set(existing.map(t => t.name))
      const missing = tagNames.filter(nm => !have.has(nm))
      if (missing.length > 0) {
        try {
          await tagRepo
            .createQueryBuilder()
            .insert()
            .into(Tag)
            .values(missing.map(nm => ({ name: nm })))
            .execute()
        } catch (e: any) {
          if (e.code !== '23505')
            throw makeError('EventError', 500, 'Failed to create tags')
        }
      }

      const allTags = await tagRepo
        .createQueryBuilder('t')
        .where('t.name IN (:...names)', { names: tagNames })
        .getMany()

      const event = evtRepo.create({
        name: n,
        description: d,
        eventDate,
        location: loc,
        category,
        author,
        maxParticipants: mp,
        tags: allTags,
      })

      return await evtRepo.save(event)
    })
  }

  async updateEvent(
    userId: number,
    eventId: number,
    name: string,
    description: string,
    eventDate: Date,
    location: string,
    categoryId: number,
    tags: string[],
    maxParticipants?: number
  ): Promise<Event> {
    const n = name?.trim()
    const d = description?.trim()
    const loc = location?.trim()
    const mp = maxParticipants == null ? null : maxParticipants

    if (!n || !d || !eventDate || !loc || !Array.isArray(tags)) {
      throw makeError('EventError', 400, 'Missing required fields')
    }
    if (mp != null && mp <= 0) {
      throw makeError('EventError', 400, 'Max participants must be > 0')
    }

    const tagNames = Array.from(
      new Set(tags.map(t => t?.trim()).filter(Boolean))
    )
    if (tagNames.length === 0) {
      throw makeError('EventError', 400, 'At least one tag is required')
    }

    return AppDataSource.transaction(async manager => {
      const catRepo = manager.getRepository(Category)
      const tagRepo = manager.getRepository(Tag)
      const evtRepo = manager.getRepository(Event)

      const event = await evtRepo.findOne({
        where: { id: eventId },
        relations: ['category', 'author', 'tags'],
      })

      if (!event)
        throw makeError('EventError', 404, `Event ${eventId} not found`)
      if (event.author.id !== userId) {
        throw makeError(
          'EventError',
          403,
          'You do not have permission to update this event'
        )
      }

      const category = await catRepo.findOneBy({ id: categoryId })
      if (!category)
        throw makeError('EventError', 404, `Category ${categoryId} not found`)

      const existing = await tagRepo
        .createQueryBuilder('t')
        .where('t.name IN (:...names)', { names: tagNames })
        .getMany()

      const have = new Set(existing.map(t => t.name))
      const missing = tagNames.filter(nm => !have.has(nm))
      if (missing.length > 0) {
        try {
          await tagRepo
            .createQueryBuilder()
            .insert()
            .into(Tag)
            .values(missing.map(nm => ({ name: nm })))
            .execute()
        } catch (e: any) {
          if (e?.code !== '23505')
            throw makeError('EventError', 500, 'Failed to create tags')
        }
      }

      const allTags = await tagRepo
        .createQueryBuilder('t')
        .where('t.name IN (:...names)', { names: tagNames })
        .getMany()

      event.name = n
      event.description = d
      event.eventDate = eventDate
      event.location = loc
      event.category = category
      event.maxParticipants = mp
      event.tags = allTags

      return await evtRepo.save(event)
    })
  }

  async deleteEvent(id: number, userId: number): Promise<void> {
    if (!id) throw makeError('EventError', 400, 'Event id is required')

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { author: true },
    })

    if (event && event.author.id !== userId)
      throw makeError(
        'EventError',
        403,
        'You do not have permission to delete this event'
      )

    const result = await this.eventRepository.delete(id)

    if (result.affected === 0) {
      throw makeError('EventError', 404, `Event with id ${id} not found`)
    }
  }
}
