import { Router } from 'express'
import { handleError } from '../lib/http'
import {
  getIdentity,
  getUserIdFromCookie,
  getUserIdOrGuest,
  isAuthorized,
} from '../lib/middlewares'
import { SessionService } from '../session/session.service'
import { Event } from './event.entity'
import { EventService } from './event.service'

const router = Router()
const eventService = new EventService()
const sessionService = new SessionService()

// Get all events
router.get('/', async (req, res) => {
  const pageSize = Number(req.query.pageSize)
  const offset = Number(req.query.offset)

  try {
    await sessionService.getOrCreateSessionId(req, res)
    const events = await eventService.getAllEvents(pageSize, offset)
    res.status(200).json(events)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get 10 most viewed events
router.get('/most-viewed', async (req, res) => {
  try {
    const events = await eventService.getTheMostViewed()
    res.status(200).json(events)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get 3 events with the most reactions
router.get('/most-reactions', async (req, res) => {
  try {
    const events = await eventService.getTheMostReactedTo()
    res.status(200).json(events)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get events by category
router.get('/category/:id', async (req, res) => {
  const pageSize = Number(req.query.pageSize)
  const offset = Number(req.query.offset)
  const categoryId = Number(req.params.id)

  try {
    const events = await eventService.getEventsByCategory(
      categoryId,
      pageSize,
      offset
    )
    res.status(200).json(events)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get events by tag
router.get('/tag/:id', async (req, res) => {
  const pageSize = Number(req.query.pageSize)
  const offset = Number(req.query.offset)
  const tagId = Number(req.params.id)

  try {
    const events = await eventService.getEventsByTag(tagId, pageSize, offset)
    res.status(200).json(events)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get event by id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    const event: Event = await eventService.getEventById(id)
    res.status(200).json(event)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Mark event viewed by user
router.put('/viewed/:id', async (req, res) => {
  const eventId = Number(req.params.id)
  try {
    const userId = await getUserIdOrGuest(req)
    const sessionId = req.cookies?.sessionId

    const updatedEvent = await eventService.increaseViewCount(
      eventId,
      userId,
      sessionId
    )

    res.status(200).json({ viewCount: updatedEvent.views })
  } catch (err) {
    handleError(res, err)
  }
})

router.put('/react/:id', async (req, res) => {
  const eventId = Number(req.params.id)
  const reactionType = req.body.reactionType

  const { userId, sessionId } = await getIdentity(req)

  try {
    await eventService.reactOnEvent(eventId, userId, sessionId!, reactionType)
    res.status(201).json({ message: `Successfully added a ${reactionType}` })
  } catch (error) {
    handleError(res, error)
  }
})

router.use(isAuthorized)

// Create a new event
router.post('/', async (req, res) => {
  try {
    const { name, description, location, tags } = req.body
    const authorId = await getUserIdFromCookie(req)
    const categoryId = Number(req.body.categoryId)
    const eventDate = new Date(req.body.eventDate)
    const maxParticipants =
      req.body.maxParticipants == null
        ? undefined
        : Number(req.body.maxParticipants)

    const newEvent = await eventService.createEvent(
      name,
      description,
      eventDate,
      location,
      categoryId,
      authorId!,
      tags,
      maxParticipants
    )
    res.status(201).json(newEvent)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Update an existing event
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const userId = await getUserIdFromCookie(req)

  const { name, description, location, tags } = req.body
  const categoryId = Number(req.body.categoryId)
  const eventDate = new Date(req.body.eventDate)
  const maxParticipants =
    req.body.maxParticipants == null
      ? undefined
      : Number(req.body.maxParticipants)

  try {
    const updatedEvent = await eventService.updateEvent(
      userId!,
      id,
      name,
      description,
      eventDate,
      location,
      categoryId,
      tags,
      maxParticipants
    )
    res.status(200).json(updatedEvent)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Delete an event
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const userId = await getUserIdFromCookie(req)
  try {
    await eventService.deleteEvent(id, userId!)
    res.status(204).send()
  } catch (err: unknown) {
    handleError(res, err)
  }
})

export { router as eventRouter }
