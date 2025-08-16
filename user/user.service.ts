import bcrypt from 'bcrypt'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { User } from './user.entity'
import { isValidEmail, type SafeUser } from './user.types'

export class UserService {
  private userRepo = AppDataSource.getRepository(User)

  async getAllUsers(
    pageSize: number,
    offset: number
  ): Promise<{ data: SafeUser[]; total: number; page: number; pages: number }> {
    const allowedSizes = [10, 25, 50]

    if (!Number.isFinite(pageSize) || !Number.isFinite(offset)) {
      throw makeError('UserError', 400, 'Page size and offset are required')
    }

    if (!allowedSizes.includes(pageSize)) {
      throw makeError('UserError', 400, 'This page size is not allowed')
    }

    const skip = Math.max(0, offset)

    const [users, total] = await this.userRepo.findAndCount({
      take: pageSize,
      skip: skip,
    })
    const safeUsers = []

    if (users) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        if (user) {
          const safeUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            type: user.type,
            status: user.status,
          }
          safeUsers.push(safeUser)
        }
      }
    }

    const page = Math.floor(skip / pageSize) + 1
    const pages = Math.max(1, Math.ceil(total / pageSize))

    return { data: safeUsers, total, page, pages }
  }

  async getUserById(id: number): Promise<SafeUser> {
    const user = await this.userRepo.findOneBy({ id })

    if (!user)
      throw makeError(
        'UserError',
        404,
        `Failed to retrieve user. There is no such user with id ${id}`
      )

    if (user.status === 'inactive')
      throw makeError('UserError', 404, `User with id ${id} is inactive`)

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: user.type,
    }

    return safeUser
  }

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<SafeUser> {
    email = email.trim().toLowerCase()
    password = password.trim()
    firstName = firstName.trim()
    lastName = lastName.trim()

    if (!email || !password)
      throw makeError('AuthError', 400, 'Email and password are required')

    if (!isValidEmail(email))
      throw makeError('AuthError', 400, 'Email is of invalid format')

    if (password.length < 8) {
      throw makeError(
        'AuthError',
        400,
        'Password must be at least 8 characters'
      )
    }

    if (!firstName || !lastName)
      throw makeError('AuthError', 400, 'First name and last name are required')

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    })

    try {
      const savedUser = await this.userRepo.save(user)
      const safeUser = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        type: savedUser.type,
        status: savedUser.status,
      }
      return safeUser
    } catch (err: any) {
      if (err.code === '23505')
        throw makeError('AuthError', 409, 'Email already exists')

      throw makeError('AuthError', 500, 'Failed to create user')
    }
  }

  async updateUser(
    id: number,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<SafeUser> {
    if (!email) throw makeError('UserError', 400, 'Email is required')

    if (!firstName || !lastName)
      throw makeError('UserError', 400, 'First name and last name are required')

    if (!isValidEmail(email))
      throw makeError('UserError', 400, 'Invalid email format')

    const user = await this.userRepo.findOneBy({ id })
    if (!user) throw makeError('UserError', 404, `No user found with id ${id}`)

    if (user.status === 'inactive')
      throw makeError('UserError', 403, `User ${id} is inactive`)

    if (user.type === 'admin') {
      throw makeError(
        'UserError',
        403,
        'You cannot update an admin user account'
      )
    }

    if (email !== user.email) {
      const existingUser = await this.userRepo.findOneBy({ email })
      if (existingUser)
        throw makeError(
          'UserError',
          409,
          'Email already in use by another user'
        )
    }

    user.email = email
    user.firstName = firstName
    user.lastName = lastName

    try {
      const updatedUser = await this.userRepo.save(user)
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        type: updatedUser.type,
      }
    } catch (e: any) {
      if (e.code === '23505')
        throw makeError('UserError', 409, 'Email already in use')
      throw makeError('UserError', 500, 'Failed to update user')
    }
  }

  async deactivateUserById(id: number): Promise<void> {
    if (!Number.isFinite(id) || id <= 0) {
      throw makeError('UserError', 400, 'Invalid user id')
    }

    await AppDataSource.transaction(async m => {
      const res = await m
        .createQueryBuilder()
        .update(User)
        .set({ status: 'inactive' })
        .where('id = :id', { id })
        .andWhere('type <> :admin', { admin: 'admin' })
        .andWhere('status <> :inactive', { inactive: 'inactive' })
        .execute()

      if (res.affected === 0) {
        throw makeError('UserError', 404, `Cannot deactivate user ${id}`)
      }
    })
  }

  async activateUserById(id: number): Promise<void> {
    if (!Number.isFinite(id) || id <= 0) {
      throw makeError('UserError', 400, 'Invalid user id')
    }

    await AppDataSource.transaction(async m => {
      const res = await m
        .createQueryBuilder()
        .update(User)
        .set({ status: 'active' })
        .where('id = :id', { id })
        .andWhere('type <> :admin', { admin: 'admin' })
        .andWhere('status <> :active', { active: 'active' })
        .execute()

      if (res.affected === 0) {
        throw makeError('UserError', 404, `Cannot activate user ${id}`)
      }
    })
  }
}
