import stream from 'stream'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL
} from './constants'
import getNextCursor from './get-next-cursor'

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream({ pool, maintenanceMode, cursor, bufferSize }) {
  stream.Readable.call(this, { objectMode: true })

  this.eventsByteSize = 0
  this.pool = pool
  this.initialCursor = cursor
  this.cursor = cursor
  this.readerId = null
  this.bufferSize = bufferSize
  this.initPromise = this.pool
    .waitConnect()
    .then(this.startProcessEvents.bind(this))
    .catch(error => (this.initError = error))

  this.injectString = injectString.bind(this, pool)
  this.injectNumber = injectNumber.bind(this, pool)
  this.maintenanceMode = maintenanceMode
  this.isBufferOverflow = false

  this.rows = []
}

EventStream.prototype = Object.create(stream.Readable.prototype)
EventStream.prototype.constructor = stream.Readable

EventStream.prototype.startProcessEvents = async function() {
  try {
    if (this.maintenanceMode === MAINTENANCE_MODE_AUTO) {
      await this.pool.freeze()
    }
  } catch (error) {
    this.emit('error', error)
  }
}

EventStream.prototype.endProcessEvents = async function() {
  try {
    if (this.maintenanceMode === MAINTENANCE_MODE_AUTO) {
      await this.pool.unfreeze()
    }
  } catch (error) {
    this.emit('error', error)
  }
}

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
      let chunk = Buffer.from(JSON.stringify(event) + '\n', 'utf8')
      const byteLength = chunk.byteLength
      if (this.eventsByteSize + byteLength > this.bufferSize) {
        this.isBufferOverflow = true
        chunk = null
      }
      this.eventsByteSize += byteLength

      if(chunk != null) {
        //console.log('prev cursor', this.cursor)
        this.cursor = getNextCursor(this.cursor, [event])
        //console.log('next cursor', this.cursor)
      }
      const isPaused = this.push(chunk) === false

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

      if (this.hasOwnProperty('initError')) {
        throw this.initError
      }

      const { events } = await this.pool.loadEventsByCursor({
        cursor: this.cursor,
        limit: BATCH_SIZE
      })

      if (this.readerId !== currentReaderId) {
        throw new Error('Reader thread changed before done')
      }


      if (events.length === 0 && !this.isLastBatch) {
        this.isLastBatch = true
        await this.endProcessEvents()
      }

      if (this.readerId !== currentReaderId) {
        throw new Error('Reader thread changed before done')
      }

      this.rows.length = 0
      for (let index = 0; index < events.length; index++) {
        this.rows[index] = events[index]
      }

      this.processEvents()

      if (this.isStreamPaused || this.rows.length === 0) {
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

EventStream.prototype.end = function() {
  this.readerId = Symbol()
  this.rows.length = 0
  this.push(null)
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

  return new EventStream({
    pool,
    maintenanceMode,
    cursor,
    bufferSize
  })
}

export default exportStream
