function ConcurrentError(message = 'Concurrency error') {
  Error.call(this)
  this.name = 'ConcurrentError'

  this.message = message

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ConcurrentError)
  } else {
    this.stack = new Error().stack
  }
}

ConcurrentError.prototype = Object.create(Error.prototype)

export default ConcurrentError
