import { Writable } from 'stream'
import { EOL } from 'os'

import {
  BUFFER_SIZE,
  BATCH_SIZE,
  MaintenanceMode
} from './constants'

class EventStream extends Writable {
  waitConnect: Function
  drop: Function
  init: Function
  freeze: Function
  unfreeze: Function
  injectEvent: Function
  byteOffset: number
  buffer: Buffer
  beginPosition: number
  endPosition: number
  vacantSize: number
  saveEventPromiseSet: Set<Promise<any>>
  saveEventErrors: Array<any>
  timestamp: number
  maintenanceMode: string
  isMaintenanceInProgress: boolean
  parsedEventsCount: number
  bypassMode: boolean
  externalTimeout: boolean
  encoding?: BufferEncoding

  constructor({ pool, maintenanceMode, byteOffset }) {
    super({ objectMode: true });

    this.waitConnect = pool.waitConnect
    this.drop = pool.drop
    this.init = pool.init
    this.freeze = pool.freeze
    this.unfreeze = pool.unfreeze
    this.injectEvent = pool.injectEvent

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

    this.on('timeout', () => {
      this.externalTimeout = true
    })
  }

  async _write(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    if (this.bypassMode) {
      await new Promise(resolve => setImmediate(resolve))
      callback()
      return
    }

    try {
      await this.waitConnect()

      if (
        this.maintenanceMode === MaintenanceMode.AUTO &&
        this.isMaintenanceInProgress === false
      ) {
        this.isMaintenanceInProgress = true
        await this.drop()
        await this.init()
        await this.freeze()
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
        let eventAsText = null
        let eventByteLength = 0

        if (this.beginPosition < endEventPosition) {
          eventAsText = this.buffer
            .slice(this.beginPosition, endEventPosition)
            .toString(this.encoding)

          eventByteLength += endEventPosition - this.beginPosition
        } else {
          eventAsText = this.buffer
            .slice(this.beginPosition, BUFFER_SIZE)
            .toString(this.encoding)
          eventAsText += this.buffer
            .slice(0, endEventPosition)
            .toString(this.encoding)

          eventByteLength += BUFFER_SIZE - this.beginPosition + endEventPosition
        }

        this.vacantSize += eventByteLength
        this.beginPosition = endEventPosition
        this.byteOffset += eventByteLength

        const event = JSON.parse(eventAsText)

        this.timestamp = Math.max(this.timestamp, event.timestamp)

        const saveEventPromise = this.injectEvent(event).catch(
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
          await Promise.all(Array.from(this.saveEventPromiseSet))
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

  async _final(callback) {
    if (this.bypassMode) {
      await new Promise(resolve => setImmediate(resolve))
      this.buffer = null
      callback()
      return
    }

    try {
      await this.waitConnect()

      if (this.vacantSize !== BUFFER_SIZE) {
        let eventAsText: string
        let eventByteLength = 0

        if (this.beginPosition < this.endPosition) {
          eventAsText = this.buffer
            .slice(this.beginPosition, this.endPosition)
            .toString(this.encoding)

          eventByteLength += this.endPosition - this.beginPosition
        } else {
          eventAsText = this.buffer
            .slice(this.beginPosition, BUFFER_SIZE)
            .toString(this.encoding)
          eventAsText += this.buffer
            .slice(0, this.endPosition)
            .toString(this.encoding)

          eventByteLength += BUFFER_SIZE - this.beginPosition + this.endPosition
        }

        let event
        try {
          event = JSON.parse(eventAsText)
        } catch {}

        if (event !== undefined) {
          this.timestamp = Math.max(this.timestamp, event.timestamp)

          this.byteOffset += eventByteLength

          const saveEventPromise = this.injectEvent(event).catch(
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

      await Promise.all(Array.from(this.saveEventPromiseSet))

      if (
        this.maintenanceMode === MaintenanceMode.AUTO &&
        this.isMaintenanceInProgress === true
      ) {
        this.isMaintenanceInProgress = false
        await this.unfreeze()
      }

      if (this.saveEventErrors.length > 0) {
        const error = new Error(
          this.saveEventErrors.map(({ message }) => message).join(EOL)
        )
        error.stack = this.saveEventErrors.map(({ stack }) => stack).join(EOL)
        throw error
      }

      callback()
    } catch (error) {
      callback(error)
    } finally {
      this.buffer = null
    }
  }
}

function importStream(
  pool,
  { byteOffset = 0, maintenanceMode = MaintenanceMode.AUTO } = {}
): EventStream {
  switch (maintenanceMode) {
    case MaintenanceMode.AUTO:
    case MaintenanceMode.MANUAL:
      return new EventStream({
        pool,
        maintenanceMode,
        byteOffset
      })
    default:
      throw new Error(`Wrong maintenance mode ${maintenanceMode}`)
  }
}

export default importStream
