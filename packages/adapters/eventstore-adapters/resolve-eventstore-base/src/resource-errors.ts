interface ResourceError extends Error {
  code: number
  name: string
}

export const ResourceAlreadyExistError: {
  new (message: string): ResourceError
} = function (this: ResourceError, message: string): void {
  Error.call(this)
  this.code = 406
  this.name = 'ResourceAlreadyExistError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResourceAlreadyExistError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((ResourceAlreadyExistError as any).is = (error: any): boolean =>
  error != null && error.name === 'ResourceAlreadyExistError')

export const ResourceNotExistError: {
  new (message: string): ResourceError
} = function (this: any, message: string): void {
  Error.call(this)
  this.code = 410
  this.name = 'ResourceNotExistError'
  this.message = message
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResourceNotExistError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((ResourceNotExistError as any).is = (error: any): boolean =>
  error != null && error.name === 'ResourceNotExistError')

ResourceAlreadyExistError.prototype = Object.create(Error.prototype)

ResourceNotExistError.prototype = Object.create(Error.prototype)
