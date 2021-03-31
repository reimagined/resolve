import { diffJson } from 'diff'
import colors from 'colors'

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
