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
ResourceAlreadyExistError.name = 'ResourceAlreadyExistError'

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
ResourceAlreadyExistError.name = 'ResourceAlreadyExistError'

ResourceAlreadyExistError.prototype = Object.create(Error.prototype)

ResourceNotExistError.prototype = Object.create(Error.prototype)
