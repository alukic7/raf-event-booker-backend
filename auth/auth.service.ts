import bcrypt from 'bcrypt'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import type { SafeUser } from '../user/user.types'
import { isValidEmail } from '../user/user.types'

export class AuthService {
  private userRepo = AppDataSource.getRepository(User)
  private sessionRepo = AppDataSource.getRepository(Session)

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<SafeUser> {
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

  async login(email: string, password: string): Promise<string> {
    if (!email || !password)
      throw makeError('AuthError', 400, 'Email and password are required')

    if (!isValidEmail(email))
      throw makeError('AuthError', 401, 'Email is of invalid format')

    const user = await this.userRepo.findOneBy({ email })

    if (!user)
      throw makeError('AuthError', 401, 'User with given email does not exist')

    if (user.status !== 'active')
      throw makeError('AuthError', 401, 'User account is inactive')

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) throw makeError('AuthError', 401, 'Invalid password')

    const session = this.sessionRepo.create({ user })
    const savedSession = await this.sessionRepo.save(session)

    return savedSession.id
  }
}
