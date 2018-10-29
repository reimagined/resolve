const RabbitMQError = function(message, stack, cause) {
  Error.call(this)
  this.name = 'RabbitMQ Bus Error'
  this.message = message
  this.stack = stack
  if (cause) {
    this.cause = cause
  }
  return this
}

export default RabbitMQError
