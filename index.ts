import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { authRouter } from './auth/auth.controller'
import { AppDataSource } from './config/data-source'
import { createAdmin } from './lib/init'
import { userRouter } from './user/user.controller'

const app = express()
const APP_PORT = process.env.APP_PORT

app.use(
  cors({
    origin: 'http://localhost:5173', // Set frontend domain here
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
)

app.use(cookieParser())
app.use(express.json())

app.use('/auth', authRouter)
app.use('/users', userRouter)

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
