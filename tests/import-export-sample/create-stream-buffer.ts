import { Writable } from 'stream'

const BUFFER_SIZE = 50 * 1024 * 1024

class WritableStreamBuffer extends Writable {
  buffer: Buffer
  size: number

  constructor() {
    super({ decodeStrings: true })
    this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
    this.size = 0
  }

  getBuffer(): Buffer {
    return this.buffer.slice(0, this.size)
  }

  _write(chunk: any, encoding: string, callback: (error?: Error) => void) {
    chunk.copy(this.buffer, this.size, 0)
    this.size += chunk.length
    setImmediate(callback)
  }
}

const createStreamBuffer = (): WritableStreamBuffer =>
  new WritableStreamBuffer()

export default createStreamBuffer
