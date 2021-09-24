import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable, pipeline } from 'stream'
import {
  EventstoreAlreadyFrozenError,
  MAINTENANCE_MODE_MANUAL,
  initThreadArray,
} from '@resolve-js/eventstore-base'
import type {
  StoredEventBatchPointer,
  StoredEvent,
  InputCursor,
} from '@resolve-js/eventstore-base'

import {
  adapterFactory,
  adapters,
  jestTimeout,
  isServerlessAdapter,
  makeTestSavedEvent,
} from '../eventstore-test-utils'

import createStreamBuffer from './create-stream-buffer'

jest.setTimeout(jestTimeout())

function getInterruptingTimeout() {
  return isServerlessAdapter() ? 200 : 100
}

function getInputEventsCount() {
  return isServerlessAdapter() ? 500 : 2500
}

function* eventsGenerator(inputCountEvents: number) {
  const threadArray = initThreadArray()

  for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
    yield Buffer.from(
      JSON.stringify(makeTestSavedEvent(eventIndex, threadArray)) + '\n',
      'utf-8'
    )
  }
}

function* longEventsGenerator(inputCountEvents: number) {
  const longData = '#'.repeat(2000)
  const threadArray = initThreadArray()

  for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
    yield Buffer.from(
      JSON.stringify(makeTestSavedEvent(eventIndex, threadArray, longData)) +
        '\n',
      'utf-8'
    )
  }
}

function* randomEventsGenerator(inputCountEvents: number) {
  const threadArray = initThreadArray()

  for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
    const data = Array.from({ length: 64 })
      .map(() => Math.round(Math.random()))
      .join('')
    yield Buffer.from(
      JSON.stringify(makeTestSavedEvent(eventIndex, threadArray, data)) + '\n',
      'utf-8'
    )
  }
}

describe('import-export events auto-mode', () => {
  beforeAll(async () => {
    await adapterFactory.create('input-auto')()
    await adapterFactory.create('output-auto')()
  })
  afterAll(async () => {
    await adapterFactory.destroy('input-auto')()
    await adapterFactory.destroy('output-auto')()
  })

  test(`${adapterFactory.name}. Should work correctly with maintenanceMode = auto`, async () => {
    const inputEventstoreAdapter = adapters['input-auto']
    const outputEventstoreAdapter = adapters['output-auto']

    const inputCountEvents = 200

    await promisify(pipeline)(
      Readable.from(eventsGenerator(inputCountEvents)),
      inputEventstoreAdapter.importEvents()
    )

    expect((await inputEventstoreAdapter.describe()).eventCount).toEqual(
      inputCountEvents
    )

    await promisify(pipeline)(
      inputEventstoreAdapter.exportEvents(),
      outputEventstoreAdapter.importEvents()
    )

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
  })
})

describe('import-export events manual mode', () => {
  const eventStorePath = 'es.db'

  beforeAll(async () => {
    await adapterFactory.create('input-manual', {
      databaseFile: eventStorePath,
    })()
    await adapterFactory.create('output-manual')()
  })
  afterAll(async () => {
    await adapterFactory.destroy('input-manual')()
    await adapterFactory.destroy('output-manual')()
  })

  test(`${adapterFactory.name}. should work correctly with maintenanceMode = manual`, async () => {
    const inputEventstoreAdapter = adapters['input-manual']
    const outputEventstoreAdapter = adapters['output-manual']

    const inputCountEvents = 50

    await promisify(pipeline)(
      Readable.from(randomEventsGenerator(inputCountEvents)),
      inputEventstoreAdapter.importEvents()
    )

    expect((await inputEventstoreAdapter.describe()).eventCount).toEqual(
      inputCountEvents
    )

    const exportBuffers = []

    let cursor: InputCursor = null
    let steps = 0

    while (true) {
      steps++

      const eventEventstoreAdapter = await adapterFactory.createNoInit(
        'input-manual',
        {
          databaseFile: eventStorePath,
        }
      )()

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
      limit: inputCountEvents + 1,
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

    await promisify(pipeline)(
      Readable.from(longEventsGenerator(inputCountEvents)),
      inputEventstoreAdapter.importEvents()
    )

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

    expect(inputCountEvents).toEqual(outputCountEvents)
    expect(isJsonStreamTimedOutOnce).toEqual(true)
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

    let allEvents: StoredEvent[] = []
    let cursor: string | null = null
    while (true) {
      const {
        events,
        cursor: nextCursor,
      }: StoredEventBatchPointer = await outputEventstoreAdapter.loadEvents({
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
