import * as fs from 'fs'
import { nanoid } from 'nanoid'
import * as path from 'path'

import { SAGA_TEST_EVENTS_COUNT, SAGA_TEST_AGGREGATE_ID } from './constants'

const appDir = process.env.TEST_APP_DIR || path.join(__dirname, '../app')

const eventStorePath = path.join(
  appDir,
  process.env.EVENT_STORE_PATH || 'event-store'
)

const run = () => {
  if (!fs.existsSync(eventStorePath)) {
    fs.mkdirSync(eventStorePath)
  }

  const eventsFilePath = path.join(eventStorePath, 'events.db')
  const secretsFilePath = path.join(eventStorePath, 'secrets.db')

  if (fs.existsSync(eventsFilePath)) {
    fs.unlinkSync(eventsFilePath)
  }
  if (fs.existsSync(secretsFilePath)) {
    fs.unlinkSync(secretsFilePath)
  }

  fs.writeFileSync(secretsFilePath, '')

  const eventTimestampInterval = 10000
  const now = Date.now()

  for (let i = 0; i < SAGA_TEST_EVENTS_COUNT; i++) {
    fs.appendFileSync(
      eventsFilePath,
      JSON.stringify({
        threadId: 0,
        threadCounter: i,
        timestamp: now - (SAGA_TEST_EVENTS_COUNT - i) * eventTimestampInterval,
        aggregateId: SAGA_TEST_AGGREGATE_ID,
        aggregateVersion: i + 1,
        type: 'SagaTestRequested',
        payload: { testId: nanoid() },
      }) + '\n'
    )
  }
}

run()
