import { isSpecificError } from './errors'

function DefineFrozenError(name: string, defaultMessage: string) {
  return class extends Error {
    constructor(msg?: string) {
      super(msg ?? defaultMessage)
      this.name = name
      Object.setPrototypeOf(this, new.target.prototype)
    }

    static is(err: any): boolean {
      return isSpecificError(err, name)
    }
  }
}

export const EventstoreFrozenError = DefineFrozenError(
  'EventstoreFrozenError',
  'Event store is frozen'
)

export const AlreadyFrozenError = DefineFrozenError(
  'AlreadyFrozenError',
  'Event store is already frozen'
)

export const AlreadyUnfrozenError = DefineFrozenError(
  'AlreadyUnfrozenError',
  'Event store is already unfrozen'
)
