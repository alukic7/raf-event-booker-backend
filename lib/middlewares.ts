import type { NextFunction, Request, Response } from 'express'
import { AppDataSource } from '../config/data-source'
import { makeError } from './errors'
import { handleError } from './http'

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies.sessionId

    if (!sessionId) throw makeError('AuthError', 401, 'Unauthorized access')

    const sessionRepo = AppDataSource.getRepository('Session')
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    })

    if (!session) throw makeError('AuthError', 401, 'Invalid session')

    if (!session.user) throw makeError('AuthError', 403, 'Invalid session')

    if (session.user.type !== 'admin')
      throw makeError('AuthError', 403, 'Access denied. You are not admin.')

    if (session.isValid === false)
      throw makeError('AuthError', 403, 'Session is no longer valid')

    next()
  } catch (err: unknown) {
    handleError(res, err)
  }
}

export async function isAuthorized(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.cookies.sessionId

    if (!sessionId) throw makeError('AuthError', 401, 'Unauthorized access')

    const sessionRepo = AppDataSource.getRepository('Session')
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    })

    if (!session) throw makeError('AuthError', 401, 'Invalid session')

    if (!session.user) throw makeError('AuthError', 403, 'Invalid session')

    if (session.isValid === false)
      throw makeError('AuthError', 403, 'Session is no longer valid')

    next()
  } catch (err: unknown) {
    handleError(res, err)
  }
}
