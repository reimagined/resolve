import { diffJson } from 'diff'
import colors from 'colors'
import { Command, ReadModelQuery } from '@resolve-js/core'
import os from 'os'
import { ExecutedSideEffect } from '../types'

export const stringifyError = (error: any): string =>
  error == null ? 'no error' : error.toString()

export const stringifyDiff = (expected: any, result: any): string =>
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

type ExecutedItem = Command | ReadModelQuery | ExecutedSideEffect

const isExecutedSideEffect = (value: any): value is ExecutedSideEffect =>
  Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'

export function stringify(item: ExecutedItem): string {
  if (isExecutedSideEffect(item)) {
    const [name, ...args] = item
    return `${name}(${args.map((arg) => JSON.stringify(arg)).join(',')})`
  }
  return JSON.stringify(item, null, 2)
}

const stringifyShouldExecuteFailure = (
  name: string,
  expected: ExecutedItem,
  executed: Array<ExecutedItem>
) =>
  `${name} assertion failed:${colors.green(
    `${os.EOL}Expected:${os.EOL}${stringify(expected)}`
  )}${os.EOL}Executed:${os.EOL}${executed
    .map((executedItem, index) =>
      colors.red(`#${index}:${os.EOL}${stringify(executedItem)}`)
    )
    .join(os.EOL)}`

export const stringifyShouldExecuteCommandFailure = (
  expectedCommand: Command,
  executedCommands: Array<Command>
): string =>
  stringifyShouldExecuteFailure(
    'shouldExecuteCommand',
    expectedCommand,
    executedCommands
  )

export const stringifyShouldExecuteQueryFailure = (
  expectedQuery: ReadModelQuery,
  executedQueries: Array<ReadModelQuery>
): string =>
  stringifyShouldExecuteFailure(
    'shouldExecuteQuery',
    expectedQuery,
    executedQueries
  )

export const stringifyShouldExecuteSideEffectFailure = (
  expectedSideEffect: ExecutedSideEffect,
  executedSideEffects: Array<ExecutedSideEffect>
): string =>
  stringifyShouldExecuteFailure(
    'shouldExecuteSideEffect',
    expectedSideEffect,
    executedSideEffects
  )
