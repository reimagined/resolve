import stream from 'stream'
import through from 'through2'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL
} from './constants'

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream(pool, maintenanceMode, cursor = 0) {
  stream.Readable.call(this, { objectMode: true })

  this.pool = pool
  this.cursor = cursor
  this.offset = cursor
  this.readerId = null
  this.initPromise = this.pool
    .waitConnectAndInit()
    .catch(error => (this.initError = error))

  this.injectString = injectString.bind(this, pool)
  this.injectNumber = injectNumber.bind(this, pool)
  this.maintenanceMode = maintenanceMode
  this.isMaintenanceInProgress = false

  this.rows = []
}

EventStream.prototype = Object.create(stream.Readable.prototype)
EventStream.prototype.constructor = stream.Readable

EventStream.prototype.processEvents = function() {
  for (
    let event = this.rows.shift();
    event != null;
    event = this.rows.shift()
  ) {
    if (this.destroyed) {
      this.rows.length = 0
      return
    } else {
      const isPaused = this.push(event) === false
      this.cursor = event.eventOffset

      if (isPaused) {
        this.isStreamPaused = true
        return
      }
    }
  }

  if (this.isLastBatch) {
    this.push(null)
  }
}

EventStream.prototype.eventReader = async function(currentReaderId) {
  try {
    await this.initPromise

    while (true) {
      if (this.readerId !== currentReaderId) {
        throw new Error('Reader thread changed before done')
      }
      let nextRows = null

      if (this.hasOwnProperty('initError')) {
        throw this.initError
      }

      nextRows = await this.pool.paginateEvents(this.offset, BATCH_SIZE)

      if (nextRows.length === 0) {
        this.isLastBatch = true
      }

      if (this.readerId !== currentReaderId) {
        throw new Error('Reader thread changed before done')
      }

      for (let index = 0; index < nextRows.length; index++) {
        const event = nextRows[index]
        event.eventOffset = this.offset + index
        this.rows.push(event)
      }
      this.offset += nextRows.length

      this.processEvents()
      if (this.isStreamPaused || nextRows.length === 0) {
        this.readerId = null
        return
      }
    }
  } catch (error) {
    this.emit('error', error)
    if (!this.destroyed) {
      this.push(null)
    }
    this.readerId = Symbol()
  }
}

EventStream.prototype._read = function() {
  this.processEvents()

  if (this.readerId == null) {
    this.readerId = Symbol()
    void this.eventReader(this.readerId)
  }
}

const exportStream = (
  pool,
  {
    cursor,
    maintenanceMode = MAINTENANCE_MODE_AUTO,
    bufferSize = Number.POSITIVE_INFINITY
  } = {}
) => {
  if (
    ![MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL].includes(maintenanceMode)
  ) {
    throw new Error(`Wrong maintenance mode ${maintenanceMode}`)
  }

  const eventStream = new EventStream(pool, maintenanceMode, cursor)

  let size = 0
  let lastEventOffset = 0
  let isDestroyed = false

  const resultStream = through.obj(
    async (event, encoding, callback) => {
      try {
        if (
          eventStream.maintenanceMode === MAINTENANCE_MODE_AUTO &&
          eventStream.isMaintenanceInProgress === false
        ) {
          eventStream.isMaintenanceInProgress = true
          await pool.freeze()
        }

        lastEventOffset = event.eventOffset
        delete event.eventOffset
        delete event.eventId

        const chunk = Buffer.from(JSON.stringify(event) + '\n', encoding)
        const byteLength = chunk.byteLength
        if (size + byteLength > bufferSize) {
          resultStream.isBufferOverflow = true
          if (!isDestroyed) {
            resultStream.cursor = lastEventOffset
            isDestroyed = true
          }
          callback(false, null)
        } else {
          callback(false, chunk)
        }
        size += byteLength
      } catch (error) {
        callback(error)
      }
    },
    async callback => {
      try {
        if (
          eventStream.maintenanceMode === MAINTENANCE_MODE_AUTO &&
          eventStream.isMaintenanceInProgress === true
        ) {
          eventStream.isMaintenanceInProgress = false
          await pool.unfreeze()
        }

        if (resultStream.cursor == null) {
          resultStream.cursor = lastEventOffset + 1
        }

        callback()
      } catch (error) {
        callback(error)
      }
      setImmediate(() => eventStream.destroy())
    }
  )

  resultStream.isBufferOverflow = false

  eventStream.on('complete', resultStream.emit.bind(resultStream, 'complete'))
  eventStream.on('abort', resultStream.emit.bind(resultStream, 'abort'))
  eventStream.on('request', resultStream.emit.bind(resultStream, 'request'))
  eventStream.on('end', resultStream.emit.bind(resultStream, 'end'))
  eventStream.on('close', resultStream.emit.bind(resultStream, 'close'))
  eventStream.on('finish', resultStream.emit.bind(resultStream, 'finish'))
  eventStream.on('error', resultStream.emit.bind(resultStream, 'error'))

  eventStream.pipe(resultStream)

  return resultStream
}

export default exportStream
