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

    if (!session) {
      throw makeError('AuthError', 400, 'Session not found')
    }

    if (session.isValid === false)
      throw makeError('AuthError', 401, 'Session is already invalid')

    session.isValid = false
    await this.sessionRepository.save(session)
  }
}
