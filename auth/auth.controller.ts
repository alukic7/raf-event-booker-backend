import Router from 'express'
import { handleError } from '../lib/http'
import { getUserIdFromCookie } from '../lib/middlewares'
import { SessionService } from '../session/session.service'
import { UserService } from '../user/user.service'
import { AuthService } from './auth.service'

const router = Router()
const authService = new AuthService()
const sessionService = new SessionService()
const userService = new UserService()

// Log in and receive session id in cookie
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const sessionId = await authService.login(email, password)
    res
      .status(200)
      .cookie('sessionId', sessionId, {
        httpOnly: true,
      })
      .json({ message: 'Login successfull' })
  } catch (err) {
    handleError(res, err)
  }
})

// Return user data by session id from cookie
router.get('/me', async (req, res) => {
  try {
    const userId = await getUserIdFromCookie(req)
    const user = await userService.getUserById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error: unknown) {
    handleError(res, error)
  }
})

// Log out
router.put('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId

    await sessionService.invalidateSession(sessionId)

    res
      .status(200)
      .clearCookie('sessionId')
      .json({ message: 'Logout successful' })
  } catch (err) {
    handleError(res, err)
  }
})

export { router as authRouter }
