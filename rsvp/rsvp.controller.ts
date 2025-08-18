// rsvp.routes.ts
import { Router } from 'express'
import { handleError } from '../lib/http'
import { getIdentity } from '../lib/middlewares'
import { RsvpService } from './rsvp.service'

const router = Router()
const rsvpService = new RsvpService()

// Register for an event
router.post('/:eventId', async (req, res) => {
  const eventId = Number(req.params.eventId)
  const rawEmail = (req.body?.email ?? null) as string | null

  try {
    const { userId, sessionId } = await getIdentity(req)

    const email = userId ? null : rawEmail
    const result = await rsvpService.registerForEvent(
      eventId,
      userId,
      email,
      sessionId!
    )
    res.status(201).json({ message: result })
  } catch (error) {
    handleError(res, error)
  }
})

// Get number of registered per event
router.get('/:eventId', async (req, res) => {
  const eventId = Number(req.params.eventId)
  try {
    const registered = await rsvpService.getNumberOfRegistered(eventId)
    res.status(200).json({ registered })
  } catch (error: unknown) {
    handleError(res, error)
  }
})

export { router as rsvpRouter }
