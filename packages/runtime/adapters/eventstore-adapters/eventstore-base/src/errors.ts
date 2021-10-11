export function isSpecificError(err: any, errorName: string): boolean {
  return err instanceof Error && err.name === errorName
}

export class ConcurrentError extends Error {
  readonly code: number

  constructor(aggregateId: string) {
    super(
      `Cannot save the event because the aggregate '${aggregateId}' is currently out of date. Please retry later.`
    )

    this.name = 'ConcurrentError'
    this.code = 409
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static is(err: any): boolean {
    return isSpecificError(err, 'ConcurrentError')
  }
}

export class AlreadyDisposedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Adapter has been already disposed')

    this.name = 'AlreadyDisposedError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
  static is(err: any): boolean {
    return isSpecificError(err, 'AlreadyDisposedError')
  }
}

function DefineErrorWithStatus(name: string, httpStatus: number) {
  return class extends Error {
    readonly code: number

    constructor(msg: string) {
      super(msg)
      this.name = name
      this.code = httpStatus
      Object.setPrototypeOf(this, new.target.prototype)
    }

    static is(err: any): boolean {
      return isSpecificError(err, name)
    }
  }
}

export const RequestTimeoutError = DefineErrorWithStatus(
  'RequestTimeoutError',
  408
)

export const ConnectionError = DefineErrorWithStatus('ConnectionError', 503)

export const ServiceBusyError = DefineErrorWithStatus('ServiceBusyError', 503)
