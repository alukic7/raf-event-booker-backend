import type { NextFunction, Request, Response } from 'express'
import { AppDataSource } from '../config/data-source'
import { Session } from '../session/session.entity'
import { makeError } from './errors'
import { handleError } from './http'

export async function getUserIdFromCookie(req: Request) {
  const sessionRepo = AppDataSource.getRepository(Session)

  const sessionId = req.cookies.sessionId
  if (!sessionId) throw makeError('AuthError', 401, 'Unauthorized access')

  const session = await sessionRepo.findOne({
    where: { id: sessionId, isValid: true },
    relations: { user: true },
  })

  if (!session) throw makeError('AuthError', 401, 'Invalid session')

  if (!session.user) throw makeError('AuthError', 401, 'Guests not allowed')

  return session.user.id
}

export async function getUserIdOrGuest(req: Request): Promise<number | null> {
  const sessionRepo = AppDataSource.getRepository(Session)

  const sessionId = req.cookies.sessionId

  const session = await sessionRepo.findOne({
    where: { id: sessionId, isValid: true },
    relations: { user: true },
  })

  if (!session) return null
  if (!session.user) return null

  return session.user.id
}

export async function getIdentity(
  req: Request
): Promise<{ userId: number | null; sessionId: string | null }> {
  const sessionId = req.cookies?.sessionId ?? null
  if (!sessionId) return { userId: null, sessionId: null }

  const sessionRepo = AppDataSource.getRepository(Session)
  const session = await sessionRepo.findOne({
    where: { id: sessionId, isValid: true },
    relations: { user: true },
  })

  if (!session) return { userId: null, sessionId: null }

  return {
    userId: session.user ? session.user.id : null,
    sessionId: session.id,
  }
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies.sessionId
    if (!sessionId) throw makeError('AuthError', 401, 'Unauthorized access')

    const sessionRepo = AppDataSource.getRepository(Session)
    const session = await sessionRepo.findOne({
      where: { id: sessionId, isValid: true },
      relations: ['user'],
    })

    if (!session) throw makeError('AuthError', 401, 'Invalid session')

    if (!session.user) throw makeError('AuthError', 403, 'Guests not allowed')

    if (session.user.type !== 'admin')
      throw makeError('AuthError', 403, 'Access denied. You are not admin.')

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

    const sessionRepo = AppDataSource.getRepository(Session)
    const session = await sessionRepo.findOne({
      where: { id: sessionId, isValid: true },
      relations: ['user'],
    })

    if (!session) throw makeError('AuthError', 401, 'Invalid session')

    if (!session.user) throw makeError('AuthError', 403, 'Guests not allowed')

    next()
  } catch (err: unknown) {
    handleError(res, err)
  }
}
