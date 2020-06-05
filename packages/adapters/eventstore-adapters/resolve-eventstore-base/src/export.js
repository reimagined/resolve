import { Readable } from 'stream'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL
} from './constants'
import getNextCursor from './get-next-cursor'

async function startProcessEventsfunction({ pool, maintenanceMode }) {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    await pool.freeze()
  }
}

async function endProcessEvents({ pool, maintenanceMode }) {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    await pool.unfreeze()
  }
}

async function* generator(context) {
  const { pool, maintenanceMode, bufferSize } = context

  await pool.waitConnect()

  await startProcessEventsfunction(context)

  let eventsByteSize = 0
  while (true) {
    const { events } = await pool.loadEventsByCursor({
      cursor: context.cursor,
      limit: BATCH_SIZE
    })

    for (const event of events) {
      let chunk = Buffer.from(JSON.stringify(event) + '\n', 'utf8')

      const byteLength = chunk.byteLength
      if (eventsByteSize + byteLength > bufferSize) {
        context.isBufferOverflow = true
        await endProcessEvents(context)
        return
      }
      eventsByteSize += byteLength

      yield chunk
      context.cursor = getNextCursor(context.cursor, [event])
    }
    if (events.length === 0) {
      await endProcessEvents(context)
      return
    }
  }
}

const exportStream = (
  pool,
  {
    cursor = null,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
    bufferSize = Number.POSITIVE_INFINITY
  } = {}
) => {
  if (
    ![MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL].includes(maintenanceMode)
  ) {
    throw new Error(`Wrong maintenance mode ${maintenanceMode}`)
  }

  const context = {
    pool,
    maintenanceMode,
    cursor,
    bufferSize,
    isBufferOverflow: false
  }

  const stream = Readable.from(generator(context))
  Object.defineProperty(stream, 'cursor', {
    get() {
      return context.cursor
    }
  })
  Object.defineProperty(stream, 'isBufferOverflow', {
    get() {
      return context.isBufferOverflow
    }
  })

  return stream
}

export default exportStream
