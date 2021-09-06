import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable, pipeline } from 'stream'
import {
  EventstoreAlreadyFrozenError,
  MAINTENANCE_MODE_MANUAL,
} from '@resolve-js/eventstore-base'
import createEventstoreAdapter from '@resolve-js/eventstore-lite'
import type {
  EventsWithCursor,
  SavedEvent,
  Cursor,
} from '@resolve-js/eventstore-base'

import {
  adapterFactory,
  adapters,
  jestTimeout,
  isServerlessAdapter,
} from '../eventstore-test-utils'

import createStreamBuffer from './create-stream-buffer'

jest.setTimeout(jestTimeout())

function getInterruptingTimeout() {
  return isServerlessAdapter() ? 200 : 100
}

function getInputEventsCount() {
  return isServerlessAdapter() ? 500 : 1600
}

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

  test(`${adapterFactory.name}. Should work correctly with maintenanceMode = auto`, async () => {
    await adapterFactory.create('input-auto')()
    await adapterFactory.create('output-auto')()

    const inputEventstoreAdapter = adapters['input-auto']
    const outputEventstoreAdapter = adapters['output-auto']

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

    await adapterFactory.destroy('input-auto')()

    const { events, cursor } = await outputEventstoreAdapter.loadEvents({
      limit: inputCountEvents + 1,
      cursor: null,
    })

    expect(events).toHaveLength(inputCountEvents)

    const extraEventCount = 50
    for (let eventIndex = 0; eventIndex < extraEventCount; eventIndex++) {
      const event = {
        aggregateId: 'aggregateId_extra',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT_EXTRA',
        payload: { eventIndex },
        timestamp: eventIndex + 1,
      }
      await outputEventstoreAdapter.saveEvent(event)
    }

    const { events: extraEvents } = await outputEventstoreAdapter.loadEvents({
      limit: extraEventCount + 1,
      cursor: cursor,
    })
    expect(extraEvents).toHaveLength(extraEventCount)

    await adapterFactory.destroy('output-auto')()
  })

  test('should work correctly with maintenanceMode = manual', async () => {
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

    let cursor: Cursor = null
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

    const { events } = await outputEventstoreAdapter.loadEvents({
      limit: 100,
      cursor: null,
    })

    expect(events.length).toEqual(inputCountEvents)
    expect(steps).toBeGreaterThan(1)
  })
})

describe('import-export timeouts', () => {
  beforeAll(async () => {
    await adapterFactory.create('export-timeout')()
    await adapterFactory.create('import-timeout')()
  })
  afterAll(async () => {
    await adapterFactory.destroy('export-timeout')()
    await adapterFactory.destroy('import-timeout')()
  })

  const inputCountEvents = getInputEventsCount() + 1

  test(`${adapterFactory.name}. Export should work correctly when stopped by timeout`, async () => {
    const inputEventstoreAdapter = adapters['export-timeout']

    const longData = '#'.repeat(2000)

    for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
      await inputEventstoreAdapter.saveEvent({
        aggregateId: 'aggregateId',
        aggregateVersion: eventIndex + 1,
        type: 'EVENT',
        payload: { eventIndex, data: longData },
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

        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => {
            resolve(true)
          }, getInterruptingTimeout())
        )

        const isJsonStreamTimedOut = await Promise.race([
          timeoutPromise,
          pipelinePromise,
        ])
        isJsonStreamTimedOutOnce =
          isJsonStreamTimedOutOnce || isJsonStreamTimedOut

        if (isJsonStreamTimedOut) {
          exportStream.emit('timeout')
          await pipelinePromise
        }

        cursor = exportStream.cursor

        const buffer = tempStream.getBuffer().toString('utf8')

        exportBuffers.push(buffer)
        if (exportStream.isEnd) {
          break
        }
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

  test(`${adapterFactory.name}. Import should work correctly when stopped by timeout`, async () => {
    const inputEventstoreAdapter = adapters['export-timeout']
    const outputEventstoreAdapter = adapters['import-timeout']

    const exportedEventsFileName = path.join(__dirname, 'exported-events.txt')

    await promisify(pipeline)(
      inputEventstoreAdapter.exportEvents(),
      fs.createWriteStream(exportedEventsFileName)
    )

    const exportedEventsFileSize = fs.statSync(exportedEventsFileName).size

    let steps = 0
    let byteOffset = 0
    let savedEventsCount = 0

    let isJsonStreamTimedOutOnce = false

    while (true) {
      let importStream
      steps++
      try {
        importStream = outputEventstoreAdapter.importEvents({
          byteOffset,
          maintenanceMode: MAINTENANCE_MODE_MANUAL,
        })

        const pipelinePromise = promisify(pipeline)(
          fs.createReadStream(exportedEventsFileName, { start: byteOffset }),
          importStream
        ).then(() => false)

        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => {
            resolve(true)
          }, getInterruptingTimeout())
        )

        const isJsonStreamTimedOut = await Promise.race([
          timeoutPromise,
          pipelinePromise,
        ])
        isJsonStreamTimedOutOnce =
          isJsonStreamTimedOutOnce || isJsonStreamTimedOut

        if (isJsonStreamTimedOut) {
          importStream.emit('timeout')
          await pipelinePromise
        }

        byteOffset = importStream.byteOffset
        savedEventsCount += importStream.savedEventsCount

        if (byteOffset >= exportedEventsFileSize) {
          break
        }
      } catch (error) {
        if (error instanceof EventstoreAlreadyFrozenError) {
          await outputEventstoreAdapter.unfreeze()
        } else {
          throw error
        }
      }
    }

    fs.unlinkSync(exportedEventsFileName)

    let allEvents: SavedEvent[] = []
    let cursor: string | null = null
    while (true) {
      const {
        events,
        cursor: nextCursor,
      }: EventsWithCursor = await outputEventstoreAdapter.loadEvents({
        cursor: cursor,
        limit: inputCountEvents,
      })
      cursor = nextCursor
      if (events.length === 0) break
      else {
        allEvents = allEvents.concat(events)
      }
    }

    expect(savedEventsCount).toEqual(inputCountEvents)
    expect(allEvents).toHaveLength(inputCountEvents)
    expect(isJsonStreamTimedOutOnce).toBeTruthy()
    expect(steps).toBeGreaterThan(1)
  })
})
