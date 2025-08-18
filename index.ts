import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { authRouter } from './auth/auth.controller'
import { categoryRouter } from './category/category.controller'
import { commentsRouter } from './comment/comments.controller'
import { AppDataSource } from './config/data-source'
import { eventRouter } from './event/event.controller'
import { createAdmin } from './lib/init'
import { rsvpRouter } from './rsvp/rsvp.controller'
import { userRouter } from './user/user.controller'

const app = express()
const APP_PORT = process.env.APP_PORT

app.use(
  cors({
    origin: 'http://localhost:5173', // Set frontend domain here
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Cookie', 'Authorization'],
  })
)

app.use(cookieParser())
app.use(express.json())

// Routes
app.use('/auth', authRouter)
app.use('/users', userRouter)
app.use('/categories', categoryRouter)
app.use('/events/comments', commentsRouter)
app.use('/events', eventRouter)
app.use('/rsvp', rsvpRouter)

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connection established successfully.')
    try {
      await createAdmin() // Creating admin user
      console.log('Admin user created.')
    } catch (err) {
      console.error(err)
    }
    app.listen(APP_PORT, () => {
      console.log(`Server is running on port ${APP_PORT}`) // Starting the http server
    })
  })
  .catch(error => {
    console.error('Error during Data Source initialization:', error)
  })
