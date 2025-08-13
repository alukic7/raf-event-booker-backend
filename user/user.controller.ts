import { Router } from 'express'
import { handleError } from '../lib/http'
import { isAdmin } from '../lib/middlewares'
import { UserService } from './user.service'
import type { SafeUser } from './user.types'

const router = Router()
const userService = new UserService()

router.use(isAdmin)

// Get all users
router.get('/', async (req, res) => {
  const pageSize = Number(req.query.pageSize)
  const offset = Number(req.query.offset)

  try {
    const users = await userService.getAllUsers(pageSize, offset)
    res.status(200).json(users)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const user: SafeUser = await userService.getUserById(id)
    res.status(200).json(user)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Add a new user
router.post('/', async (req, res) => {
  const { email, password, firstName, lastName } = req.body
  try {
    const newUser = await userService.createUser(
      email,
      password,
      firstName,
      lastName
    )
    res.status(201).json(newUser)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Update user by id
router.put('/:id', async (req, res) => {
  const { email, firstName, lastName } = req.body
  const id = Number(req.params.id)
  try {
    const updatedUser = await userService.updateUser(
      id,
      email,
      firstName,
      lastName
    )
    res.status(200).json(updatedUser)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Deactivate user by id
router.put('/deactivate/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await userService.deactivateUserById(id)
    res
      .status(204)
      .json({ message: `User ${id} account deactivated successfully` })
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Activate user by id
router.put('/activate/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await userService.activateUserById(id)
    res
      .status(204)
      .json({ message: `User ${id} account activated successfully` })
  } catch (err: unknown) {
    handleError(res, err)
  }
})

export { router as userRouter }
