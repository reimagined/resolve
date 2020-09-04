const util = require('util')
const stream = require('stream')

const BUFFER_SIZE = 50 * 1024 * 1024

let buffer = null

const WritableStreamBuffer = function WritableStreamBuffer() {
  stream.Writable.call(this, { decodeStrings: true })

  if (buffer == null) {
    buffer = Buffer.allocUnsafe(BUFFER_SIZE)
  }
  let size = 0

  this.getBuffer = () => buffer.slice(0, size)

  // eslint-disable-next-line no-underscore-dangle
  this._write = function _write(chunk, encoding, callback) {
    chunk.copy(buffer, size, 0)
    size += chunk.length
    callback()
  }
}

util.inherits(WritableStreamBuffer, stream.Writable)

const createStreamBuffer = () => new WritableStreamBuffer()

export default createStreamBuffer
