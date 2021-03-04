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
import {
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  ImportOptions,
} from './types'

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
  this.saveEventPromiseSet = new Set()
  this.saveEventErrors = []
  this.timestamp = 0
  this.maintenanceMode = maintenanceMode
  this.isMaintenanceInProgress = false
  this.parsedEventsCount = 0
  this.bypassMode = false
  this.savedEventsCount = 0

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
    await this.pool.waitConnect()

    const { dropEvents, initEvents, freeze, injectEvent }: any = this.pool

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
      let stringifiedEvent = null
      let eventByteLength = 0

      if (this.beginPosition < endEventPosition) {
        stringifiedEvent = this.buffer
          .slice(this.beginPosition, endEventPosition)
          .toString(this.encoding)

        eventByteLength += endEventPosition - this.beginPosition
      } else {
        stringifiedEvent = this.buffer
          .slice(this.beginPosition, BUFFER_SIZE)
          .toString(this.encoding)
        stringifiedEvent += this.buffer
          .slice(0, endEventPosition)
          .toString(this.encoding)

        eventByteLength += BUFFER_SIZE - this.beginPosition + endEventPosition
      }

      this.vacantSize += eventByteLength
      this.beginPosition = endEventPosition
      this.byteOffset += eventByteLength

      const event: any = JSON.parse(stringifiedEvent)

      this.timestamp = Math.max(this.timestamp, event.timestamp)

      const saveEventPromise = injectEvent(event)
        .then(() => {
          this.savedEventsCount++
        })
        .catch(this.saveEventErrors.push.bind(this.saveEventErrors))
      void saveEventPromise.then(
        this.saveEventPromiseSet.delete.bind(
          this.saveEventPromiseSet,
          saveEventPromise
        )
      )
      this.saveEventPromiseSet.add(saveEventPromise)

      if (this.parsedEventsCount++ >= BATCH_SIZE) {
        await Promise.all([...this.saveEventPromiseSet])
        if (this.externalTimeout === true) {
          this.bypassMode = true
        }
        this.parsedEventsCount = 0
      }
    }

    callback()
  } catch (error) {
    callback(error)
  }
}

EventStream.prototype._final = async function (callback: any): Promise<void> {
  if (this.bypassMode) {
    try {
      await Promise.all([...this.saveEventPromiseSet])
      callback()
    } catch (err) {
      callback(err)
    } finally {
      this.buffer = null
    }
    return
  }

  try {
    await this.pool.waitConnect()
    const { unfreeze, injectEvent } = this.pool

    if (this.vacantSize !== BUFFER_SIZE) {
      let stringifiedEvent = null
      let eventByteLength = 0

      if (this.beginPosition < this.endPosition) {
        stringifiedEvent = this.buffer
          .slice(this.beginPosition, this.endPosition)
          .toString(this.encoding)

        eventByteLength += this.endPosition - this.beginPosition
      } else {
        stringifiedEvent = this.buffer
          .slice(this.beginPosition, BUFFER_SIZE)
          .toString(this.encoding)
        stringifiedEvent += this.buffer
          .slice(0, this.endPosition)
          .toString(this.encoding)

        eventByteLength += BUFFER_SIZE - this.beginPosition + this.endPosition
      }

      let event: any = PARTIAL_EVENT_FLAG
      try {
        event = JSON.parse(stringifiedEvent)
      } catch {}

      if (event !== PARTIAL_EVENT_FLAG) {
        this.timestamp = Math.max(this.timestamp, event.timestamp)

        this.byteOffset += eventByteLength

        const saveEventPromise: any = injectEvent(event)
          .then(() => {
            this.savedEventsCount++
          })
          .catch(this.saveEventErrors.push.bind(this.saveEventErrors))
        void saveEventPromise.then(
          this.saveEventPromiseSet.delete.bind(
            this.saveEventPromiseSet,
            saveEventPromise
          )
        )
        this.saveEventPromiseSet.add(saveEventPromise)
      }
    }

    await Promise.all([...this.saveEventPromiseSet])

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

const importEventsStream = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  {
    byteOffset = 0,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
  }: Partial<ImportOptions> = {}
): stream.Writable => {
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
