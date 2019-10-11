import stream from 'stream'
import { EOL } from 'os'

import {
  BUFFER_SIZE,
  PARTIAL_EVENT_FLAG,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  BATCH_SIZE
} from './constants'

function EventStream({ pool, maintenanceMode, byteOffset, eventId }) {
  stream.Writable.call(this, { objectMode: true })

  this.pool = pool
  this.byteOffset = byteOffset
  this.eventId = eventId
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

  this.on('timeout', () => {
    this.externalTimeout = true
  })
}

EventStream.prototype = Object.create(stream.Writable.prototype)
EventStream.prototype.constructor = stream.Writable

EventStream.prototype._write = async function(chunk, encoding, callback) {
  if (this.bypassMode) {
    await new Promise(resolve => setImmediate(resolve))
    callback()
    return
  }

  try {
    await this.pool.waitConnect()

    const { drop, init, freeze, saveEventOnly } = this.pool

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === false
    ) {
      this.isMaintenanceInProgress = true
      await drop()
      await init()
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

      const endEventPosition =
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

      const event = JSON.parse(stringifiedEvent)
      event.eventId = this.eventId++
      this.timestamp = Math.max(this.timestamp, event.timestamp)

      const saveEventPromise = saveEventOnly(event).catch(
        this.saveEventErrors.push.bind(this.saveEventErrors)
      )
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

EventStream.prototype._final = async function(callback) {
  if (this.bypassMode) {
    await new Promise(resolve => setImmediate(resolve))
    this.buffer = null
    callback()
    return
  }

  try {
    await this.pool.waitConnect()
    const { unfreeze, saveEventOnly } = this.pool

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

      let event = PARTIAL_EVENT_FLAG
      try {
        event = JSON.parse(stringifiedEvent)
      } catch {}

      if (event !== PARTIAL_EVENT_FLAG) {
        event.eventId = this.eventId++
        this.timestamp = Math.max(this.timestamp, event.timestamp)

        this.byteOffset += eventByteLength

        const saveEventPromise = saveEventOnly(event).catch(
          this.saveEventErrors.push.bind(this.saveEventErrors)
        )
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
      throw new Error(this.saveEventErrors.join(EOL))
    }

    callback()
  } catch (error) {
    callback(error)
  } finally {
    this.buffer = null
  }
}

const importStream = (
  pool,
  { byteOffset = 0, eventId = 1, maintenanceMode = MAINTENANCE_MODE_AUTO } = {}
) => {
  switch (maintenanceMode) {
    case MAINTENANCE_MODE_AUTO:
    case MAINTENANCE_MODE_MANUAL:
      return new EventStream({
        pool,
        maintenanceMode,
        byteOffset,
        eventId
      })
    default:
      throw new Error(`Wrong maintenance mode ${maintenanceMode}`)
  }
}

export default importStream
