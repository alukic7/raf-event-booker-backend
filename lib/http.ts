import type { Response } from 'express'
import { formatAppError, isAppError, makeError } from './errors'

// Handle typed erorrs and
export function handleError(res: Response, err: unknown): void {
  if (isAppError(err)) {
    res.status(err.status).json(formatAppError(err))
  } else {
    const fallback = makeError(
      'UnknownError',
      500,
      'An unknown error occurred.'
    )
    res.status(fallback.status).json(formatAppError(fallback))
  }
}
