import { Router } from 'express'
import { handleError } from '../lib/http'
import { getIdentity, getUserIdFromCookie } from '../lib/middlewares'
import { UserService } from '../user/user.service'
import { CommentsService } from './comments.service'

const router = Router()
const commentsService = new CommentsService()
const userService = new UserService()

// Get all comments for an event
router.get('/:eventId', async (req, res) => {
  const eventId = Number(req.params.eventId)
  const pageSize = Number(req.query.pageSize)
  const offset = Number(req.query.offset)

  try {
    const comments = await commentsService.getAllComments(
      eventId,
      pageSize,
      offset
    )
    res.status(200).json(comments)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Create a new comment
router.post('/:eventId', async (req, res) => {
  try {
    const eventId = Number.parseInt(req.params.eventId, 10)
    const content = req.body.content
    let authorName

    if (req.cookies.sessionId) {
      const authorId = await getUserIdFromCookie(req)
      const author = await userService.getUserById(authorId)
      authorName = author.firstName

      const newComment = await commentsService.createComment(
        authorName,
        content,
        eventId
      )
      res.status(201).json(newComment)
    } else {
      authorName = req.body.authorName

      const newComment = await commentsService.createComment(
        authorName,
        content,
        eventId
      )
      res.status(201).json(newComment)
    }
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// React to a comment
router.put('/react/:id', async (req, res) => {
  const commentId = Number(req.params.id)
  const reactionType = req.body.reactionType

  const { userId, sessionId } = await getIdentity(req)

  try {
    await commentsService.reactOnComment(
      commentId,
      userId,
      sessionId!,
      reactionType
    )
    res.status(201).json({ message: `Successfully added a ${reactionType}` })
  } catch (error) {
    handleError(res, error)
  }
})

export { router as commentsRouter }
