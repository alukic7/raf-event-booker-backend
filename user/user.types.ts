import { User } from './user.entity'

// Exclude the password from the user object before returning it at creation
export type SafeUser = Omit<User, 'password' | 'status'>

// User account type
export type UserType = 'event_creator' | 'admin'

// User account status
export type UserStatus = 'active' | 'inactive'

// Validate user email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
