import Router from 'express'
import { handleError } from '../lib/http'
import { SessionService } from '../session/session.service'
import { AuthService } from './auth.service'

const router = Router()
const authService = new AuthService()
const sessionService = new SessionService()

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
