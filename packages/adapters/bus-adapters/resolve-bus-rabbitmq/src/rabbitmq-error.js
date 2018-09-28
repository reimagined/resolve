const RabbitMQError = function(message, cause) {
  if(typeof this === 'undefined') {
    return new RabbitMQError(message, cause)
  }
  Error.call(this)
  this.name = 'RabbitMQ Bus Error'
  this.message = message
  if (cause) {
    this.cause = cause
  }
  return this
}

export default RabbitMQError
