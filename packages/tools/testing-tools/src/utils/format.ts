import { diffJson } from 'diff'
import colors from 'colors'
import { Command, ReadModelQuery } from '@resolve-js/core'
import os from 'os'

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

export function stringify(item: Command | ReadModelQuery): string {
  return JSON.stringify(item, null, 2)
}

export const stringifySideEffectInvocation = ([name, ...args]: Array<
  [string, ...any[]]
>) => `${name}(${args.map((arg) => JSON.stringify(arg)).join(',')})`

const stringifyShouldExecuteFailure = (
  name: string,
  expected: Command | ReadModelQuery,
  executed: Array<Command | ReadModelQuery>
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
