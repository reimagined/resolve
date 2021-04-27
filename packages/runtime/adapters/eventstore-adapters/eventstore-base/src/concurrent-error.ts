const ConcurrentError = (function (this: Error, aggregateId: string): void {
  Error.call(this)
  this.name = 'ConcurrentError'
  this.message = `Cannot save the event because the aggregate '${aggregateId}' is currently out of date. Please retry later.`

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ConcurrentError)
  } else {
    this.stack = new Error().stack
  }
} as unknown) as { new (aggregateId: string): Error }

ConcurrentError.prototype = Object.create(Error.prototype)

export default ConcurrentError
