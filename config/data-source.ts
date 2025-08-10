import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Category } from '../category/category.entity'
import { Event } from '../event/event.entity'
import { Session } from '../session/session.entity'
import { User } from '../user/user.entity'

// Put Postgres connection details in .env file
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User, Session, Category, Event], // Add your entity classes here
})
