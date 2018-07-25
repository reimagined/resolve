import { Server } from 'http'
import express from 'express'

const app = express()
const server = new Server(app)

export { app, server }
