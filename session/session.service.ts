import type { Request, Response } from 'express'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Session } from './session.entity'

export class SessionService {
  private sessionRepository = AppDataSource.getRepository(Session)

  async invalidateSession(sessionId: string): Promise<void> {
    if (!sessionId) throw makeError('AuthError', 400, 'Session id required')
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    })
    if (!session) throw makeError('AuthError', 400, 'Session not found')
    if (!session.isValid)
      throw makeError('AuthError', 401, 'Session is already invalid')
    session.isValid = false
    await this.sessionRepository.save(session)
  }

  async createGuestSession() {
    const guestSession = this.sessionRepository.create({ user: null })
    return await this.sessionRepository.save(guestSession)
  }

  async getOrCreateSessionId(req: Request, res: Response): Promise<string> {
    const sessionId = req.cookies?.sessionId
    if (sessionId) {
      const existing = await this.sessionRepository.findOne({
        where: { id: sessionId },
      })
      if (existing?.isValid) return sessionId
    }

    const created = await this.createGuestSession()
    this.setSessionCookie(res, created.id)
    return created.id
  }

  setSessionCookie(res: Response, id: string) {
    res.cookie('sessionId', id, {
      httpOnly: true,
    })
  }
}
