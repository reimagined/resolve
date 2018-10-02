const ZeroMQBusError = function(message, stack, cause) {
  Error.call(this)
  this.name = 'ZeroMQ Bus Error'
  this.message = message
  this.stack = stack
  if (cause) {
    this.cause = cause
  }
  return this
}

export default ZeroMQBusError
