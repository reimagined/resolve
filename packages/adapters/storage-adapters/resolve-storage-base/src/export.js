import stream from 'stream'

import {
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL
} from './constants'

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream({ pool, maintenanceMode, cursor, bufferSize }) {
  stream.Readable.call(this, { objectMode: true })

  this.eventsByteSize = 0
  this.pool = pool
  this.initialCursor = cursor
  this.offset = cursor
  this.readerId = null
  this.bufferSize = bufferSize
  this.initPromise = this.pool
    .waitConnectAndInit()
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
      const eventOffset = event.eventOffset
      delete event.eventOffset
      delete event.eventId

      let chunk = Buffer.from(JSON.stringify(event) + '\n', 'utf8')
      const byteLength = chunk.byteLength
      if (this.eventsByteSize + byteLength > this.bufferSize) {
        this.isBufferOverflow = true
        chunk = null
        this.cursor = eventOffset
      } else {
        this.lastEventOffset = eventOffset
      }
      this.eventsByteSize += byteLength

      const isPaused = this.push(chunk) === false

      if (isPaused) {
        this.isStreamPaused = true
        return
      }
    }
  }

  if (this.isLastBatch) {
    if (this.cursor == null) {
      this.cursor = this.offset
    }
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

      if (nextRows.length === 0 && !this.isLastBatch) {
        this.isLastBatch = true
        await this.endProcessEvents()
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

EventStream.prototype.end = function() {
  this.readerId = Symbol()
  this.rows.length = 0
  if (this.lastEventOffset == null) {
    this.cursor = this.initialCursor
  } else {
    this.cursor = this.lastEventOffset + 1
  }
  this.push(null)
}

const exportStream = (
  pool,
  {
    cursor = 0,
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
