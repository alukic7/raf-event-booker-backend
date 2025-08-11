import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import type { UserStatus, UserType } from './user.types'

@Check(`char_length("password") >= 8`)
@Check(`char_length("email") > 0`)
@Check(`char_length("first_name") > 0`)
@Check(`char_length("last_name") > 0`)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false, unique: true, length: 255 })
  email: string

  @Column({ nullable: false, length: 255 })
  password: string

  @Column({ name: 'first_name', nullable: false, length: 100 })
  firstName: string

  @Column({ name: 'last_name', nullable: false, length: 100 })
  lastName: string

  @Column({
    nullable: false,
    type: 'varchar',
    length: 20,
    default: 'event_creator',
  })
  type: UserType

  @Column({ nullable: false, type: 'varchar', length: 20, default: 'active' })
  status: UserStatus
}
