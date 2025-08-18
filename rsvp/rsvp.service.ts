// rsvp.service.ts
import { AppDataSource } from '../config/data-source'
import { Event } from '../event/event.entity'
import { makeError } from '../lib/errors'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import { isValidEmail } from '../user/user.types'
import { Rsvp } from './rsvp.entity'

export class RsvpService {
  rsvpService = AppDataSource.getRepository(Rsvp)

  async registerForEvent(
    eventId: number,
    userId: number | null,
    guestEmail: string | null,
    sessionId: string | null
  ): Promise<string> {
    if (!eventId) {
      throw makeError('RsvpError', 400, 'Event id required')
    }

    if (!sessionId) throw makeError('AuthError', 401, 'Session invalid')

    return await AppDataSource.transaction(async manager => {
      const sessionRepo = manager.getRepository(Session)
      const eventRepo = manager.getRepository(Event)
      const userRepo = manager.getRepository(User)
      const rsvpRepo = manager.getRepository(Rsvp)

      const session = await sessionRepo.findOne({
        where: { id: sessionId, isValid: true },
        relations: { user: true },
      })
      if (!session) throw makeError('AuthError', 401, 'Invalid session')

      let user = null
      if (userId) {
        user = await userRepo.findOneBy({ id: userId })
        if (!user) throw makeError('RsvpError', 404, 'User not found')
        if (user.status === 'inactive') {
          throw makeError('RsvpError', 403, 'User is inactive')
        }
      } else {
        if (!guestEmail) {
          throw makeError('RsvpError', 400, 'Guest email required')
        }
        if (!isValidEmail(guestEmail))
          throw makeError('RsvpError', 400, 'Invalid email format')
      }

      const event = await eventRepo
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .where('event.id = :id', { id: eventId })
        .getOne()
      if (!event) {
        throw makeError('RsvpError', 404, 'Event not found')
      }

      const existing = await rsvpRepo.findOne({
        where: user
          ? { event: { id: eventId }, user: { id: user.id } }
          : { event: { id: eventId }, email: guestEmail! },
      })
      if (existing) {
        throw makeError('RsvpError', 409, 'Already registered for this event')
      }

      if (event.maxParticipants) {
        const count = await rsvpRepo.count({
          where: { event: { id: eventId } },
        })
        if (count >= event.maxParticipants) {
          throw makeError('RsvpError', 409, 'Event is full')
        }
      }

      const rsvp = rsvpRepo.create({
        event: { id: eventId } as Event,
        user: user ? ({ id: user.id } as User) : null,
        email: user ? null : guestEmail,
      })

      await rsvpRepo.save(rsvp)

      return 'Successfully registered for event'
    })
  }

  async getNumberOfRegistered(eventId: number) {
    if (!eventId) throw makeError('RsvpError', 401, 'Event id required')

    const registered = await this.rsvpService.count({
      where: { event: { id: eventId } },
    })

    return registered
  }
}
