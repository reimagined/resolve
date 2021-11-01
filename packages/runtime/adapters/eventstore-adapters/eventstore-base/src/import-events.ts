import stream from 'stream'
import { EOL } from 'os'

import {
  BUFFER_SIZE,
  PARTIAL_EVENT_FLAG,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  BATCH_SIZE,
} from './constants'

import { ResourceNotExistError } from './resource-errors'
import type {
  AdapterBoundPool,
  ImportOptions,
  ImportEventsStream,
} from './types'

const MAX_EVENTS_BATCH_BYTE_SIZE = 32768

export const getStringifiedEvent = (params: {
  buffer: Buffer
  bufferSize: number
  beginPosition: number
  endPosition: number
  encoding: BufferEncoding
}): {
  stringifiedEvent: string
  eventByteLength: number
} => {
  const { buffer, bufferSize, beginPosition, endPosition, encoding } = params
  if (beginPosition < endPosition) {
    const stringifiedEvent = buffer
      .slice(beginPosition, endPosition)
      .toString(encoding)

    const eventByteLength = endPosition - beginPosition

    return {
      stringifiedEvent,
      eventByteLength,
    }
  } else {
    const stringifiedEvent = Buffer.concat([
      buffer.slice(beginPosition, bufferSize),
      buffer.slice(0, endPosition),
    ]).toString(encoding)
    const eventByteLength = bufferSize - beginPosition + endPosition

    return {
      stringifiedEvent,
      eventByteLength,
    }
  }
}

async function flushEvents(stream: any) {
  const eventsToInject = stream.eventsToInject
  stream.eventsToInject = []
  stream.currentBatchByteSize = 0

  if (eventsToInject.length === 0) {
    return
  }

  await stream.pool
    .injectEvents(eventsToInject)
    .then(() => {
      stream.savedEventsCount += eventsToInject.length
    })
    .catch(stream.saveEventErrors.push.bind(stream.saveEventErrors))
}

const EventStream = function (
  this: any,
  { pool, maintenanceMode, byteOffset }: any
): void {
  stream.Writable.call(this, { objectMode: true })

  this.pool = pool
  this.byteOffset = byteOffset
  this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
  this.beginPosition = 0
  this.endPosition = 0
  this.vacantSize = BUFFER_SIZE
  this.saveEventErrors = []
  this.timestamp = 0
  this.maintenanceMode = maintenanceMode
  this.isMaintenanceInProgress = false
  this.bypassMode = false
  this.savedEventsCount = 0
  this.currentBatchByteSize = 0
  this.eventsToInject = []

  this.on('timeout', () => {
    this.externalTimeout = true
  })
}

EventStream.prototype = Object.create(stream.Writable.prototype)
EventStream.prototype.constructor = stream.Writable

EventStream.prototype._write = async function (
  chunk: any,
  encoding: any,
  callback: any
): Promise<void> {
  if (this.bypassMode) {
    await new Promise((resolve) => setImmediate(resolve))
    callback()
    return
  }

  try {
    const { dropEvents, initEvents, freeze }: any = this.pool

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === false
    ) {
      this.isMaintenanceInProgress = true
      try {
        await dropEvents()
      } catch (error) {
        if (!ResourceNotExistError.is(error)) {
          throw error
        }
      }
      await initEvents()
      await freeze()
    }

    if (this.encoding == null) {
      this.encoding = encoding
    } else if (this.encoding !== encoding) {
      throw new Error('Multiple encodings not supported')
    }
    if (chunk.byteLength > this.vacantSize) {
      throw new Error('Buffer overflow')
    }

    if (chunk.byteLength + this.endPosition <= BUFFER_SIZE) {
      chunk.copy(this.buffer, this.endPosition)
    } else {
      chunk.copy(
        this.buffer,
        this.endPosition,
        0,
        BUFFER_SIZE - this.endPosition
      )
      chunk.copy(
        this.buffer,
        0,
        BUFFER_SIZE - this.endPosition,
        chunk.byteLength
      )
    }
    this.endPosition = (this.endPosition + chunk.byteLength) % BUFFER_SIZE
    this.vacantSize -= chunk.byteLength

    if (this.vacantSize === BUFFER_SIZE) {
      callback()
      return
    }

    let eolPosition = 0
    while (true) {
      eolPosition = chunk.indexOf('\n', eolPosition, this.encoding)
      if (eolPosition < 0) {
        break
      } else {
        eolPosition++
      }

      const endEventPosition: number =
        (BUFFER_SIZE + this.endPosition - chunk.byteLength + eolPosition) %
        BUFFER_SIZE

      const { stringifiedEvent, eventByteLength } = getStringifiedEvent({
        buffer: this.buffer,
        bufferSize: BUFFER_SIZE,
        encoding: this.encoding,
        beginPosition: this.beginPosition,
        endPosition: endEventPosition,
      })

      this.vacantSize += eventByteLength
      this.beginPosition = endEventPosition
      this.byteOffset += eventByteLength

      const event: any = JSON.parse(stringifiedEvent)

      this.timestamp = Math.max(this.timestamp, event.timestamp)

      if (
        this.currentBatchByteSize + eventByteLength >
          MAX_EVENTS_BATCH_BYTE_SIZE ||
        this.eventsToInject.length >= BATCH_SIZE
      ) {
        await flushEvents(this)

        if (this.externalTimeout === true) {
          this.bypassMode = true
        }
      }

      this.eventsToInject.push(event)
      this.currentBatchByteSize += eventByteLength
    }

    callback()
  } catch (error) {
    callback(error)
  }
}

EventStream.prototype._final = async function (callback: any): Promise<void> {
  if (this.bypassMode) {
    try {
      await flushEvents(this)
      callback()
    } catch (err) {
      callback(err)
    } finally {
      this.buffer = null
    }
    return
  }

  try {
    const { unfreeze } = this.pool

    if (this.vacantSize !== BUFFER_SIZE) {
      const { stringifiedEvent, eventByteLength } = getStringifiedEvent({
        buffer: this.buffer,
        bufferSize: BUFFER_SIZE,
        encoding: this.encoding,
        beginPosition: this.beginPosition,
        endPosition: this.endPosition,
      })

      let event: any = PARTIAL_EVENT_FLAG
      try {
        event = JSON.parse(stringifiedEvent)
      } catch {}

      if (event !== PARTIAL_EVENT_FLAG) {
        this.timestamp = Math.max(this.timestamp, event.timestamp)

        this.byteOffset += eventByteLength

        this.eventsToInject.push(event)
        this.currentBatchByteSize += eventByteLength
      }
    }

    await flushEvents(this)

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === true
    ) {
      this.isMaintenanceInProgress = false
      await unfreeze()
    }

    if (this.saveEventErrors.length > 0) {
      const error = new Error(
        this.saveEventErrors.map(({ message }: any) => message).join(EOL)
      )
      error.stack = this.saveEventErrors
        .map(({ stack }: any) => stack)
        .join(EOL)
      throw error
    }

    callback()
  } catch (error) {
    callback(error)
  } finally {
    this.buffer = null
  }
}

const importEventsStream = <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  {
    byteOffset = 0,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
  }: Partial<ImportOptions> = {}
): ImportEventsStream => {
  switch (maintenanceMode) {
    case MAINTENANCE_MODE_AUTO:
    case MAINTENANCE_MODE_MANUAL:
      return new (EventStream as any)({
        pool,
        maintenanceMode,
        byteOffset,
      })
    default:
      throw new Error(`Wrong maintenance mode ${String(maintenanceMode)}`)
  }
}

export default importEventsStream
