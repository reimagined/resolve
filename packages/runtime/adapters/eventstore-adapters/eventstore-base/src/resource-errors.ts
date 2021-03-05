import { CheckForResourceError } from './types'

interface ResourceError extends Error {
  code: number
  name: string
}

export const ResourceAlreadyExistError: {
  new (message: string): ResourceError
  is: (error: any) => boolean
} = function (this: ResourceError, message: string): void {
  Error.call(this)
  this.code = 406
  this.message = message
  Object.assign(this, { name: 'ResourceAlreadyExistError' })
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
  is: (error: any) => boolean
} = function (this: any, message: string): void {
  Error.call(this)
  this.code = 410
  this.message = message
  Object.assign(this, { name: 'ResourceNotExistError' })
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ResourceNotExistError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((ResourceNotExistError as any).is = (error: any): boolean =>
  error != null && error.name === 'ResourceNotExistError')

ResourceAlreadyExistError.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: ResourceAlreadyExistError },
})

ResourceNotExistError.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: ResourceNotExistError },
})

const allowedResourceErrorsConstructors = Array.from<Function>([
  ResourceAlreadyExistError,
  ResourceNotExistError,
])

export const maybeThrowResourceError: CheckForResourceError = (
  errors: Error[]
): void => {
  if (
    !Array.isArray(errors) ||
    !errors.reduce(
      (acc: boolean, error: Error) => acc && error instanceof Error,
      true
    )
  ) {
    throw new Error(`Resource errors array is invalid ${errors}`)
  }
  if (errors.length === 0) {
    return
  }
  const messages = errors.map((error) => error.message).join('\n')
  const stacks = errors.map((error) => error.stack).join('\n')

  const errorConstructors: Set<Function> = errors.reduce(
    (acc, error) => acc.add(error.constructor),
    new Set<Function>()
  )
  let ErrorConstructor: Function =
    errorConstructors.size === 1 ? [...errorConstructors.values()][0] : Error

  if (!allowedResourceErrorsConstructors.includes(ErrorConstructor)) {
    ErrorConstructor = Error
  }

  const error = new ((ErrorConstructor as unknown) as {
    new (arg: string): Error
  })(messages)
  error.stack = stacks

  throw error
}
