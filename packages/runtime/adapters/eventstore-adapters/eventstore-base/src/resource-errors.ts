import { CheckForResourceError } from './types'

function DefineResourceError(name: string, errorCode: number) {
  return class ResourceError extends Error {
    code: number

    constructor(msg: string) {
      super(msg)
      this.name = name
      this.code = errorCode
      Object.setPrototypeOf(this, new.target.prototype)
    }

    static is(err: any): boolean {
      return err instanceof Error && err.name === name
    }
  }
}

export const ResourceAlreadyExistError = DefineResourceError(
  'ResourceAlreadyExistError',
  406
)

export const ResourceNotExistError = DefineResourceError(
  'ResourceNotExistError',
  410
)

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
