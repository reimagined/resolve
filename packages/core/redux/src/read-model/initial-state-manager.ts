import isEqual from 'lodash.isequal'
import { ReadModelQuery } from '@resolve-js/client'
import getHash from '../internal/get-hash'

type StateManagerEntry = {
  references: number
  state: any
}
type Selector =
  | string
  | {
      query: ReadModelQuery
    }

const initialStateManager = new Map<string, StateManagerEntry>()

const getSelectorKey = (selector: Selector): string => {
  if (typeof selector === 'string') {
    return selector
  }
  const { name, resolver, args } = selector.query
  return `${getHash(name)}:${getHash(resolver)}:${getHash(args)}`
}

export const setSelectorState = (selector: Selector, state: any): void => {
  const key = getSelectorKey(selector)

  const entry = initialStateManager.get(key)
  if (entry != null) {
    if (!isEqual(entry.state, state)) {
      throw Error(`initial states conflict, check useReduxReadModel hook calls`)
    }
    entry.references++
  } else {
    initialStateManager.set(getSelectorKey(selector), {
      references: 1,
      state,
    })
  }
}

export const getSelectorState = (selector: Selector): any => {
  const entry = initialStateManager.get(getSelectorKey(selector))
  if (entry != null) {
    return entry.state
  }
  return null
}

export const releaseSelectorState = (selector: Selector): void => {
  const entry = initialStateManager.get(getSelectorKey(selector))
  if (entry != null) {
    entry.references--
    if (entry.references === 0) {
      initialStateManager.delete(getSelectorKey(selector))
    }
  }
}
