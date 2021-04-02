import { diffJson } from 'diff'
import colors from 'colors'
import { Command, ReadModelQuery } from '@resolve-js/core'

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

export const stringifyCommand = (command: Command): string =>
  JSON.stringify(command, null, 2)

export const stringifyQuery = (query: ReadModelQuery): string =>
  JSON.stringify(query, null, 2)

export const stringifySideEffectInvocation = ([name, ...args]: Array<
  [string, ...any[]]
>) => `${name}(${args.map((arg) => JSON.stringify(arg)).join(',')})`
