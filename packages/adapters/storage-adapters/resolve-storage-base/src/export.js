import stream from 'stream'
import through from 'through2'

import { BATCH_SIZE, DATA_API_ERROR_FLAG } from './constants'

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream(pool, cursor = 0) {
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
      const isPaused =
        this.push({
          ...event,
          payload: JSON.parse(event.payload)
        }) === false
      this.cursor = event.eventOffset

      if (isPaused) {
        this.readerId = null
        return
      }
    }
  }
}

EventStream.prototype.eventReader = async function(currentReaderId) {
  await this.initPromise

  while (this.readerId === currentReaderId) {
    let nextRows = null

    try {
      if (this.hasOwnProperty('initError')) {
        throw this.initError
      }
      nextRows = await this.pool.paginateEvents(this.offset, BATCH_SIZE)
    } catch (error) {
      this.emit('error', error)
      this.push(null)
      this.readerId = null
      nextRows = DATA_API_ERROR_FLAG
    }

    if (nextRows === DATA_API_ERROR_FLAG || this.readerId !== currentReaderId) {
      return
    }

    for (let index = 0; index < nextRows.length; index++) {
      const event = nextRows[index]
      event.eventOffset = this.offset + index
      this.rows.push(event)
    }
    this.offset += nextRows.length

    this.processEvents()

    if (nextRows.length === 0) {
      if (!this.destroyed) {
        this.push(null)
      }

      this.readerId = null
      return
    }
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
  { cursor, bufferSize = Number.POSITIVE_INFINITY } = {}
) => {
  const eventStream = new EventStream(pool, cursor)

  let size = 0
  let lastEventOffset = 0
  let isDestroyed = false

  const resultStream = through.obj(
    (event, encoding, callback) => {
      lastEventOffset = event.eventOffset
      delete event.eventOffset
      delete event.eventId

      const chunk = Buffer.from(JSON.stringify(event) + '\n', encoding)
      const byteLength = chunk.byteLength
      if (size + byteLength > bufferSize) {
        resultStream.isBufferOverflow = true
        eventStream.destroy()
        if (!isDestroyed) {
          resultStream.cursor = lastEventOffset
          isDestroyed = true
        }
        callback(false, null)
      } else {
        size += byteLength
        callback(false, chunk)
      }
    },
    callback => {
      eventStream.destroy()

      if (resultStream.cursor == null) {
        resultStream.cursor = lastEventOffset + 1
      }

      callback()
    }
  )

  resultStream.isBufferOverflow = false

  eventStream.on('error', resultStream.emit.bind(resultStream, 'error'))

  eventStream.pipe(resultStream)

  return resultStream
}

export default exportStream
