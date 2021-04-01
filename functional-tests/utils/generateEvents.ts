import * as fs from 'fs'
import { nanoid } from 'nanoid'
import * as path from 'path'

import { SAGA_TEST_EVENTS_COUNT, SAGA_TEST_AGGREGATE_ID } from './constants'

const appDir = process.env.TEST_APP_DIR || path.join(__dirname, '../app')

const eventsFilePath = path.join(
  appDir,
  process.env.EVENTS_FILE_PATH || 'events.txt'
)

const run = () => {
  if (fs.existsSync(eventsFilePath)) {
    fs.unlinkSync(eventsFilePath)
  }

  const eventTimestampInterval = 10000
  const now = Date.now()

  for (let i = 0; i < SAGA_TEST_EVENTS_COUNT; i++) {
    fs.appendFileSync(
      eventsFilePath,
      JSON.stringify({
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
