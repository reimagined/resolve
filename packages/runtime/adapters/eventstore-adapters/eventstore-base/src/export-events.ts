import { Readable } from 'stream'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
} from './constants'
import getNextCursor from './get-next-cursor'
import { AlreadyFrozenError, AlreadyUnfrozenError } from './frozen-errors'
import type { EventLoader } from './types'

import type {
  AdapterBoundPool,
  ExportOptions,
  ExportEventsStream,
  InputCursor,
  StoredEvent,
} from './types'

type Context<ConfiguredProps extends {}> = {
  pool: AdapterBoundPool<ConfiguredProps>
  maintenanceMode: ExportOptions['maintenanceMode']
  cursor: InputCursor
  bufferSize: number
  isBufferOverflow: boolean
  isEnd: boolean
  externalTimeout: boolean
  preferRegularEventLoader: boolean
}

const FLUSH_CHUNK_SIZE = 64 * 1024 * 1024

async function startProcessEvents<ConfiguredProps extends {}>({
  pool,
  maintenanceMode,
  cursor,
  preferRegularEventLoader,
}: Context<ConfiguredProps>): Promise<EventLoader> {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    try {
      await pool.freeze()
    } catch (error) {
      if (!AlreadyFrozenError.is(error)) {
        throw error
      }
    }
  }
  return await pool.getEventLoader(
    { cursor },
    { preferRegular: preferRegularEventLoader }
  )
}

async function endProcessEvents<ConfiguredProps extends {}>(
  { pool, maintenanceMode }: Context<ConfiguredProps>,
  eventLoader: EventLoader
): Promise<void> {
  try {
    if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
      try {
        await pool.unfreeze()
      } catch (error) {
        if (!AlreadyUnfrozenError.is(error)) {
          throw error
        }
      }
    }
  } finally {
    await eventLoader.close()
  }
}

type EventRecord = {
  buffer: Buffer
  event: StoredEvent
}

async function* generator<ConfiguredProps extends {}>(
  context: Context<ConfiguredProps>
): AsyncGenerator<Buffer, void> {
  const { bufferSize } = context

  let eventsByteSize = 0

  const eventLoader = await startProcessEvents(context)

  while (true) {
    const { events } = await eventLoader.loadEvents(BATCH_SIZE)

    let currentTotalChunkSize = 0
    let eventRecords: EventRecord[] = []

    function* flushEvents() {
      if (eventRecords.length <= 0) {
        return
      }

      yield Buffer.concat(eventRecords.map((record) => record.buffer))
      context.cursor = getNextCursor(
        context.cursor,
        eventRecords.map((record) => record.event)
      )
      eventRecords = []
      currentTotalChunkSize = 0
    }

    for (const event of events) {
      const buffer: Buffer = Buffer.from(JSON.stringify(event) + '\n', 'utf8')

      const byteLength = buffer.byteLength
      if (eventsByteSize + byteLength > bufferSize) {
        yield* flushEvents()

        context.isBufferOverflow = true
        await endProcessEvents(context, eventLoader)
        return
      }
      eventsByteSize += byteLength

      if (currentTotalChunkSize + buffer.byteLength > FLUSH_CHUNK_SIZE) {
        yield* flushEvents()

        if (context.externalTimeout) {
          await endProcessEvents(context, eventLoader)
          return
        }
      }
      eventRecords.push({ buffer, event })
      currentTotalChunkSize += buffer.byteLength
    }

    void (yield* flushEvents())

    if (events.length < BATCH_SIZE) {
      context.isEnd = true
      await endProcessEvents(context, eventLoader)
      return
    } else if (context.externalTimeout) {
      await endProcessEvents(context, eventLoader)
      return
    }
  }
}

const exportEventsStream = <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  {
    cursor = null,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
    bufferSize = Number.POSITIVE_INFINITY,
    preferRegularEventLoader = false,
  }: Partial<ExportOptions> = {}
): ExportEventsStream => {
  if (
    ![MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL].includes(maintenanceMode)
  ) {
    throw new Error(`Wrong maintenance mode ${String(maintenanceMode)}`)
  }

  const context: Context<ConfiguredProps> = {
    pool,
    maintenanceMode,
    cursor,
    bufferSize,
    isBufferOverflow: false,
    isEnd: false,
    externalTimeout: false,
    preferRegularEventLoader: preferRegularEventLoader,
  }

  const stream: ExportEventsStream = Readable.from(
    generator(context)
  ) as ExportEventsStream
  stream.on('timeout', () => {
    context.externalTimeout = true
  })
  Object.defineProperty(stream, 'cursor', {
    get() {
      return context.cursor
    },
  })
  Object.defineProperty(stream, 'isBufferOverflow', {
    get() {
      return context.isBufferOverflow
    },
  })
  Object.defineProperty(stream, 'isEnd', {
    get() {
      return context.isEnd
    },
  })
  Object.defineProperty(stream, 'preferRegularEventLoader', {
    get() {
      return context.preferRegularEventLoader
    },
  })

  return stream
}

export default exportEventsStream
