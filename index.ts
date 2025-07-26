import express from 'express'
import { AppDataSource } from './config/data-source'

const app = express()
const APP_PORT = process.env.APP_PORT

app.use(express.json())

AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established successfully.')
    app.listen(APP_PORT, () => {
      console.log(`Server is running on port ${APP_PORT}`)
    })
  })
  .catch(error => {
    console.error('Error during Data Source initialization:', error)
  })
