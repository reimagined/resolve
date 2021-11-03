import type {
  AlreadyDisposedErrorInstance,
  AlreadyDisposedErrorFactory,
  ExtractNewable,
} from './types'

const AlreadyDisposedError: AlreadyDisposedErrorFactory = Object.assign(
  (function (this: AlreadyDisposedErrorInstance): void {
    Error.call(this)
    this.name = 'AlreadyDisposedError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlreadyDisposedError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<AlreadyDisposedErrorFactory>,
  {
    is(error: Error): boolean {
      return (
        (error != null && error.constructor === AlreadyDisposedError) ||
        error.name === 'AlreadyDisposedError'
      )
    },
  }
)

export default AlreadyDisposedError
