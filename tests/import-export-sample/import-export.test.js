import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { MAINTENANCE_MODE_MANUAL, pipeline } from 'resolve-storage-base'
import createStorageAdapter from 'resolve-storage-lite'

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
    const inputStorageAdapter = createStorageAdapter({
      databaseFile: ':memory:'
    })
    const outputStorageAdapter = createStorageAdapter({
      databaseFile: ':memory:'
    })

    const inputCountEvents = 300

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputStorageAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex },
        timestamp: eventIndex + 1
      })
    }

    await pipeline(inputStorageAdapter.export(), outputStorageAdapter.import())

    let outputCountEvents = 0
    await outputStorageAdapter.loadEvents({}, () => {
      outputCountEvents++
    })

    expect(outputCountEvents).toEqual(inputCountEvents)
  })

  test('should works correctly with maintenanceMode = manual', async () => {
    const eventStorageAdapter = createStorageAdapter({
      databaseFile: eventStorePath
    })
    const outputStorageAdapter = createStorageAdapter({
      databaseFile: ':memory:'
    })

    const inputCountEvents = 20

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await eventStorageAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: Array.from({ length: 64 })
          .map(() => Math.round(Math.random()))
          .join(''),
        timestamp: eventIndex + 1
      })
    }

    await eventStorageAdapter.dispose()

    const exportBuffers = []
    let cursor = 0

    while (true) {
      const eventStorageAdapter = createStorageAdapter({
        databaseFile: path.join(__dirname, 'es.txt')
      })

      const exportStream = eventStorageAdapter.export({
        maintenanceMode: MAINTENANCE_MODE_MANUAL,
        bufferSize: 512,
        cursor
      })

      const tempStream = createStreamBuffer()

      await pipeline(exportStream, tempStream)

      await eventStorageAdapter.dispose()

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

    await pipeline(exportBufferStream, outputStorageAdapter.import())

    let outputCountEvents = 0
    await outputStorageAdapter.loadEvents({}, () => {
      outputCountEvents++
    })

    expect(outputCountEvents).toEqual(inputCountEvents)
  })

  test('should works correctly when stopped by timeout ', async () => {
    const inputStorageAdapter = createStorageAdapter({
      databaseFile: ':memory:'
    })

    const inputCountEvents = 1000

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputStorageAdapter.saveEvent({
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
      const exportStream = inputStorageAdapter.export({ cursor })
      const tempStream = createStreamBuffer()
      const pipelinePromise = pipeline(exportStream, tempStream).then(
        () => false
      )

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
