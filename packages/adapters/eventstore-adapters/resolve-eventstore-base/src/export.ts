import { Readable } from 'stream'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
} from './constants'
import getNextCursor from './get-next-cursor'

import {
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  ExportOptions,
} from './types'

async function startProcessEvents({
  pool,
  maintenanceMode,
}: any): Promise<void> {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    await pool.freeze()
  }
}

async function endProcessEvents({ pool, maintenanceMode }: any): Promise<void> {
  if (maintenanceMode === MAINTENANCE_MODE_AUTO) {
    await pool.unfreeze()
  }
}

async function* generator(context: any): AsyncGenerator<Buffer, void> {
  const { pool, bufferSize }: any = context

  await pool.waitConnect()

  await startProcessEvents(context)

  let eventsByteSize = 0
  while (true) {
    const { events }: any = await pool.loadEventsByCursor({
      cursor: context.cursor,
      limit: BATCH_SIZE,
    })

    for (const event of events) {
      const chunk: Buffer = Buffer.from(JSON.stringify(event) + '\n', 'utf8')

      const byteLength: number = chunk.byteLength
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

const exportStream = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  {
    cursor = null,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
    bufferSize = Number.POSITIVE_INFINITY,
  }: Partial<ExportOptions> = {}
): Readable => {
  if (
    ![MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL].includes(maintenanceMode)
  ) {
    throw new Error(`Wrong maintenance mode ${String(maintenanceMode)}`)
  }

  const context: any = {
    pool,
    maintenanceMode,
    cursor,
    bufferSize,
    isBufferOverflow: false,
  }

  const stream: Readable = Readable.from(generator(context))
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

  return stream
}

export default exportStream
