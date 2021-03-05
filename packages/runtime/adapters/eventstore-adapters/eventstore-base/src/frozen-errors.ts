export const EventstoreFrozenError: {
  new (message?: string): Error
  is: (error: any) => boolean
} = function (this: Error, message?: string): void {
  Error.call(this)
  this.message = message ?? 'Event store is frozen'
  this.name = 'EventstoreFrozenError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, EventstoreFrozenError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((EventstoreFrozenError as any).is = (error: any): boolean =>
  error != null && error.name === 'EventstoreFrozenError')

EventstoreFrozenError.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: EventstoreFrozenError },
})

export const AlreadyFrozenError: {
  new (message?: string): Error
  is: (error: any) => boolean
} = function (this: Error, message?: string): void {
  Error.call(this)
  this.message = message ?? 'Event store is already frozen'
  this.name = 'AlreadyFrozenError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, AlreadyFrozenError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((AlreadyFrozenError as any).is = (error: any): boolean =>
  error != null && error.name === 'AlreadyFrozenError')

AlreadyFrozenError.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: AlreadyFrozenError },
})

export const AlreadyUnfrozenError: {
  new (message?: string): Error
  is: (error: any) => boolean
} = function (this: Error, message?: string): void {
  Error.call(this)
  this.message = message ?? 'Event store is already unfrozen'
  this.name = 'AlreadyUnfrozenError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, AlreadyUnfrozenError)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((AlreadyUnfrozenError as any).is = (error: any): boolean =>
  error != null && error.name === 'AlreadyUnfrozenError')

AlreadyUnfrozenError.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: AlreadyUnfrozenError },
})
