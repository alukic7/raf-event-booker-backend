import bcrypt from 'bcrypt'
import { AppDataSource } from '../config/data-source'
import { User } from '../user/user.entity'
import { makeError } from './errors'

export async function createAdmin() {
  const userRepo = AppDataSource.getRepository(User)
  const hashedAdminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10)
  const adminUser = userRepo.create({
    email: 'alukicdev@gmail.com',
    password: hashedAdminPassword,
    firstName: 'Aleksa',
    lastName: 'Lukić',
    type: 'admin',
  })

  try {
    await userRepo.save(adminUser)
  } catch (error) {
    throw makeError('AdminError', 500, 'Failed to create admin user')
  }
}
