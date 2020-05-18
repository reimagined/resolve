import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable, pipeline } from 'stream'
import { MAINTENANCE_MODE_MANUAL } from 'resolve-eventstore-base'
import createEventstoreAdapter from 'resolve-eventstore-lite'

import createStreamBuffer from './create-stream-buffer'

jest.setTimeout(1000 * 60 * 5)

describe('import-export', () => {
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
      databaseFile: ':memory:'
    })
    const outputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:'
    })
    await inputEventstoreAdapter.init()
    await outputEventstoreAdapter.init()

    const inputCountEvents = 300

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex },
        timestamp: eventIndex + 1
      })
    }

    await promisify(pipeline)(
      inputEventstoreAdapter.export(),
      outputEventstoreAdapter.import()
    )

    let outputCountEvents = 0
    await outputEventstoreAdapter.loadEvents({}, () => {
      outputCountEvents++
    })

    expect(outputCountEvents).toEqual(inputCountEvents)
  })

  test('should works correctly with maintenanceMode = manual', async () => {
    const eventEventstoreAdapter = createEventstoreAdapter({
      databaseFile: eventStorePath
    })
    const outputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:'
    })
    await eventEventstoreAdapter.init()
    await outputEventstoreAdapter.init()

    const inputCountEvents = 20

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await eventEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: Array.from({ length: 64 })
          .map(() => Math.round(Math.random()))
          .join(''),
        timestamp: eventIndex + 1
      })
    }

    await eventEventstoreAdapter.dispose()

    const exportBuffers = []
    let cursor = 0

    while (true) {
      const eventEventstoreAdapter = createEventstoreAdapter({
        databaseFile: path.join(__dirname, 'es.txt')
      })

      const exportStream = eventEventstoreAdapter.export({
        maintenanceMode: MAINTENANCE_MODE_MANUAL,
        bufferSize: 512,
        cursor
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
    exportBufferStream._read = function() {
      this.push(exportBuffer)
      this.push(null)
    }

    await promisify(pipeline)(
      exportBufferStream,
      outputEventstoreAdapter.import()
    )

    let outputCountEvents = 0
    await outputEventstoreAdapter.loadEvents({}, () => {
      outputCountEvents++
    })

    expect(outputCountEvents).toEqual(inputCountEvents)
  })

  test('should works correctly when stopped by timeout ', async () => {
    const inputEventstoreAdapter = createEventstoreAdapter({
      databaseFile: ':memory:'
    })
    await inputEventstoreAdapter.init()

    const inputCountEvents = 1000

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex },
        timestamp: eventIndex + 1
      })
    }

    let cursor = 0

    let isJsonStreamTimedOutOnce = false

    const exportBuffers = []
    while (cursor !== inputCountEvents) {
      const exportStream = inputEventstoreAdapter.export({ cursor })
      const tempStream = createStreamBuffer()
      const pipelinePromise = promisify(pipeline)(
        exportStream,
        tempStream
      ).then(() => false)

      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => {
          resolve(true)
        }, 1)
      )

      const isJsonStreamTimedOut = await Promise.race([
        timeoutPromise,
        pipelinePromise
      ])
      isJsonStreamTimedOutOnce =
        isJsonStreamTimedOutOnce || isJsonStreamTimedOut

      exportStream.end()

      exportStream.destroy()

      cursor = exportStream.cursor

      exportBuffers.push(tempStream.getBuffer().toString('utf8'))
    }

    const outputEvents = exportBuffers
      .join('')
      .trim()
      .split('\n')
      .map(eventAsString => JSON.parse(eventAsString.trim()))
    const outputCountEvents = outputEvents.length

    expect(isJsonStreamTimedOutOnce).toEqual(true)
    expect(inputCountEvents).toEqual(outputCountEvents)
  })
})
