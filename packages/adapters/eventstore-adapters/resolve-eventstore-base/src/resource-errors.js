export function ResourceAlreadyExistError(message) {
  Error.call(this)
  this.code = 406
  this.name = 'ResourceAlreadyExistError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResourceAlreadyExistError)
  } else {
    this.stack = new Error().stack
  }
}
ResourceAlreadyExistError.is = (error) =>
  error != null && error.name === 'ResourceAlreadyExistError'

export function ResourceNotExistError(message) {
  Error.call(this)
  this.code = 410
  this.name = 'ResourceNotExistError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResourceNotExistError)
  } else {
    this.stack = new Error().stack
  }
}
ResourceNotExistError.is = (error) =>
  error != null && error.name === 'ResourceNotExistError'

ResourceAlreadyExistError.prototype = Object.create(Error.prototype)

ResourceNotExistError.prototype = Object.create(Error.prototype)
