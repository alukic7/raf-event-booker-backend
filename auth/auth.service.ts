import bcrypt from 'bcrypt'
import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { isValidEmail } from '../user/user.types'

export class AuthService {
  private userRepo = AppDataSource.getRepository(User)
  private sessionRepo = AppDataSource.getRepository(Session)
  private userService = new UserService()

  async login(
    email: string,
    password: string,
    guestSessionId: string
  ): Promise<string> {
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

    if (guestSessionId) {
      await this.sessionRepo.update({ id: guestSessionId }, { isValid: false })
    }

    const session = this.sessionRepo.create({ user })
    const savedSession = await this.sessionRepo.save(session)

    return savedSession.id
  }
}
