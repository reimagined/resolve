import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable, pipeline } from 'stream'
import {
  EventstoreAlreadyFrozenError,
  MAINTENANCE_MODE_MANUAL,
} from 'resolve-eventstore-base'
import createEventstoreAdapter from 'resolve-eventstore-lite'

import createStreamBuffer from './create-stream-buffer'

jest.setTimeout(1000 * 60 * 5)

describe('import-export events', () => {
  const eventStorePath = path.join(__dirname, 'es.txt')

  afterAll(() => {
    if (fs.existsSync(eventStorePath)) {
      fs.unlinkSync(eventStorePath)
    }
    if (fs.existsSync(`${eventStorePath}-journal`)) {
      fs.unlinkSync(`${eventStorePath}-journal`)
    }
  })

  beforeAll(() => {
    if (fs.existsSync(eventStorePath)) {
      fs.unlinkSync(eventStorePath)
    }
    if (fs.existsSync(`${eventStorePath}-journal`)) {
      fs.unlinkSync(`${eventStorePath}-journal`)
    }
  })

  test('should works correctly with maintenanceMode = auto', async () => {
    const inputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:',
    })
    const outputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:',
    })
    await inputEventstoreAdapter.init()
    await outputEventstoreAdapter.init()

    const inputCountEvents = 200

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      const event = {
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex },
        timestamp: eventIndex + 1,
      }
      await inputEventstoreAdapter.saveEvent(event)
    }

    await promisify(pipeline)(
      inputEventstoreAdapter.exportEvents(),
      outputEventstoreAdapter.importEvents()
    )

    const { events } = await outputEventstoreAdapter.loadEvents({ limit: 300 })

    expect(events.length).toEqual(inputCountEvents)
  })

  test('should works correctly with maintenanceMode = manual', async () => {
    const eventEventstoreAdapter = createEventstoreAdapter({
      databaseFile: eventStorePath,
    })
    const outputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:',
    })
    await eventEventstoreAdapter.init()
    await outputEventstoreAdapter.init()

    const inputCountEvents = 50

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await eventEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: Array.from({ length: 64 })
          .map(() => Math.round(Math.random()))
          .join(''),
        timestamp: eventIndex + 1,
      })
    }

    await eventEventstoreAdapter.dispose()

    const exportBuffers = []

    let cursor = null
    let steps = 0

    while (true) {
      steps++

      const eventEventstoreAdapter = createEventstoreAdapter({
        databaseFile: eventStorePath,
      })

      const exportStream = eventEventstoreAdapter.exportEvents({
        maintenanceMode: MAINTENANCE_MODE_MANUAL,
        bufferSize: 512,
        cursor,
      })

      const tempStream = createStreamBuffer()

      await promisify(pipeline)(exportStream, tempStream)

      await eventEventstoreAdapter.dispose()

      exportBuffers.push(tempStream.getBuffer().toString())

      if (exportStream.isBufferOverflow) {
        cursor = exportStream.cursor
      } else {
        break
      }
    }

    const exportBuffer = Buffer.from(exportBuffers.join(''))

    const exportBufferStream = new Readable()
    exportBufferStream._read = function () {
      this.push(exportBuffer)
      this.push(null)
    }

    await promisify(pipeline)(
      exportBufferStream,
      outputEventstoreAdapter.importEvents()
    )

    const { events } = await outputEventstoreAdapter.loadEvents({ limit: 100 })

    expect(events.length).toEqual(inputCountEvents)
    expect(steps).toBeGreaterThan(1)
  })

  test('should works correctly when stopped by timeout ', async () => {
    const inputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:',
    })
    await inputEventstoreAdapter.init()

    const inputCountEvents = 1000

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex },
        timestamp: eventIndex + 1,
      })
    }

    let cursor = null
    let steps = 0

    let isJsonStreamTimedOutOnce = false

    const exportBuffers = []
    while (true) {
      steps++

      try {
        const exportStream = inputEventstoreAdapter.exportEvents({ cursor })
        const tempStream = createStreamBuffer()
        const pipelinePromise = promisify(pipeline)(
          exportStream,
          tempStream
        ).then(() => false)

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => {
            resolve(true)
          }, 100)
        )

        const isJsonStreamTimedOut = await Promise.race([
          timeoutPromise,
          pipelinePromise,
        ])
        isJsonStreamTimedOutOnce =
          isJsonStreamTimedOutOnce || isJsonStreamTimedOut

        exportStream.destroy()

        cursor = exportStream.cursor

        const buffer = tempStream.getBuffer().toString('utf8')

        if (buffer === '') {
          break
        }

        exportBuffers.push(buffer)
      } catch (error) {
        if (error instanceof EventstoreAlreadyFrozenError) {
          await inputEventstoreAdapter.unfreeze()
        } else {
          throw error
        }
      }
    }

    const outputEvents = exportBuffers
      .join('')
      .trim()
      .split('\n')
      .map((eventAsString) => JSON.parse(eventAsString.trim()))
    const outputCountEvents = outputEvents.length

    expect(isJsonStreamTimedOutOnce).toEqual(true)
    expect(inputCountEvents).toEqual(outputCountEvents)
    expect(steps).toBeGreaterThan(1)
  })
})
