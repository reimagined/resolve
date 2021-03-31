import * as fs from 'fs'
import { nanoid } from 'nanoid'
import * as path from 'path'

import { SAGA_TEST_EVENTS_COUNT, SAGA_TEST_AGGREGATE_ID } from './constants'

const eventsFilePath = path.join(__dirname, '../app/events.txt')

const run = () => {
  fs.unlinkSync(eventsFilePath)

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
