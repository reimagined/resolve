import isEqual from 'lodash.isequal'
import { diffJson } from 'diff'
import colors from 'colors'
import { CommandResult } from '@resolve-js/core'
import { Phases, symbol } from './constants'

export type BDDAggregateAssertion = (
  resolve: Function,
  reject: Function,
  result: CommandResult | null,
  error: any
) => void

type BDDAggregateAssertionState = {
  phase: Phases
  assertion: BDDAggregateAssertion
  isDefaultAssertion: boolean
}

type BDDAggregateAssertionContext = {
  [symbol]: BDDAggregateAssertionState
}

const stringifyError = (error: any): string =>
  error == null ? 'no error' : error.toString()

const stringifyDiff = (expected: any, result: any): string =>
  diffJson(expected, result, { undefinedReplacement: '<undefined>' })
    .map((change: any) => {
      let color = colors.gray
      let prefix = ''

      if (change.added) {
        color = colors.green
        prefix = '+'
      } else if (change.removed) {
        color = colors.red
        prefix = '-'
      }

      return color(`${prefix}${change.value}`)
    })
    .join('')

const checkState = (state: BDDAggregateAssertionState): TypeError | null => {
  if (state.phase < Phases.COMMAND) {
    return new TypeError('invalid phase')
  }
  if (!state.isDefaultAssertion) {
    return new TypeError('assertion already assigned')
  }
  return null
}

export const shouldProduceEvent = (
  context: BDDAggregateAssertionContext,
  expectedEvent: CommandResult
) => {
  const { [symbol]: state } = context
  const invalidStateError = checkState(state)
  if (invalidStateError) {
    throw invalidStateError
  }
  state.assertion = (resolve, reject, result, error) => {
    if (error) {
      return reject(
        new Error(`expected an event, but received an error ${error}`)
      )
    }
    if (!isEqual(result, expectedEvent)) {
      return reject(
        new Error(
          `shouldProduceEvent assertion failed:\n ${stringifyDiff(
            expectedEvent,
            result
          )}`
        )
      )
    }
    return resolve(result)
  }
  state.isDefaultAssertion = false
  return context
}

export const shouldThrow = (
  context: BDDAggregateAssertionContext,
  expectedError: any
) => {
  const { [symbol]: state } = context
  const invalidStateError = checkState(state)
  if (invalidStateError) {
    throw invalidStateError
  }
  state.assertion = (resolve, reject, result, error) => {
    if (!error) {
      return reject(
        new Error(`expected an error, but received no error received`)
      )
    }
    if (!isEqual(error, expectedError)) {
      return reject(
        new Error(
          `expected error ${stringifyError(
            expectedError
          )}, but received ${stringifyError(error)}`
        )
      )
    }
    return resolve(result)
  }
  state.isDefaultAssertion = false
  return context
}
