import { ReadModelQuery } from '@resolve-js/client'
import { v4 as uuid } from 'uuid'
import {
  setSelectorState,
  releaseSelectorState,
  getSelectorState,
} from '../../src/read-model/initial-state-manager'

describe('initial state manager', () => {
  describe('query selector', () => {
    let querySelector: { query: ReadModelQuery }

    beforeEach(() => {
      querySelector = {
        query: {
          name: uuid(),
          resolver: 'resolver',
          args: {
            a: 'a',
          },
        },
      }
    })

    test('basic manipulations', () => {
      setSelectorState(querySelector, 'state')
      expect(getSelectorState(querySelector)).toEqual('state')
      releaseSelectorState(querySelector)
      expect(getSelectorState(querySelector)).toBeNull()
    })

    test('initial states conflict', () => {
      setSelectorState(querySelector, 'state-1')
      expect(() => setSelectorState(querySelector, 'state-2')).toThrow()
      releaseSelectorState(querySelector)
    })

    test('same initial state reference counter', () => {
      setSelectorState(querySelector, 'state')
      setSelectorState(querySelector, 'state')
      expect(getSelectorState(querySelector)).toEqual('state')
      releaseSelectorState(querySelector)
      expect(getSelectorState(querySelector)).toEqual('state')
      releaseSelectorState(querySelector)
      expect(getSelectorState(querySelector)).toBeNull()
    })
  })

  describe('named selector', () => {
    let selector: string

    beforeEach(() => {
      selector = uuid()
    })

    test('basic manipulations', () => {
      setSelectorState(selector, 'state')
      expect(getSelectorState(selector)).toEqual('state')
      releaseSelectorState(selector)
      expect(getSelectorState(selector)).toBeNull()
    })

    test('initial states conflict', () => {
      setSelectorState(selector, 'state-1')
      expect(() => setSelectorState(selector, 'state-2')).toThrow()
    })

    test('same initial state reference counter', () => {
      setSelectorState(selector, 'state')
      setSelectorState(selector, 'state')
      expect(getSelectorState(selector)).toEqual('state')
      releaseSelectorState(selector)
      expect(getSelectorState(selector)).toEqual('state')
      releaseSelectorState(selector)
      expect(getSelectorState(selector)).toBeNull()
    })
  })
})
