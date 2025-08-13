import { Category } from '../category/category.entity'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Tag } from '../tag/tag.entity'
import { User } from '../user/user.entity'
import { Event } from './event.entity'

export class EventService {
  eventRepository = AppDataSource.getRepository(Event)

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.find({
      order: { createdAt: 'DESC' },
      relations: { author: true },
    })
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
    const n = name?.trim(),
      d = description?.trim(),
      loc = location?.trim()

    if (!n || !d || !eventDate || !loc || !Array.isArray(tags)) {
      throw makeError('EventError', 400, 'Missing required fields')
    }
    if (maxParticipants != null && maxParticipants <= 0) {
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
        maxParticipants: maxParticipants ?? null,
        tags: allTags,
      })

      const saved = await evtRepo.save(event)
      return saved
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
    const n = name?.trim(),
      d = description?.trim(),
      loc = location?.trim()

    if (!n || !d || !eventDate || !loc || !Array.isArray(tags)) {
      throw makeError('EventError', 400, 'Missing required fields')
    }
    if (maxParticipants != null && maxParticipants <= 0) {
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

      if (event && event.author.id !== userId) {
        throw makeError(
          'EventError',
          403,
          'You do not have permission to update this event'
        )
      }

      if (!event)
        throw makeError('EventError', 404, `Event ${eventId} not found`)

      const [category] = await Promise.all([
        catRepo.findOneBy({ id: categoryId }),
      ])
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
      event.maxParticipants = maxParticipants ?? null
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
