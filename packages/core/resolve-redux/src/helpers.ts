import { v4 as uuid } from 'uuid'

const regExpAbsoluteUrl = /:\/\//i
const regExpLeadingSlash = /^\//i

export function isOptions<T>(x: any): x is T {
  return x != null && Object(x) === x && x.success == null
}
export function isActionCreators<T>(creators: string[], x: any): x is T {
  return (
    x &&
    typeof x === 'object' &&
    creators.reduce<boolean>(
      (found, creator) => found || typeof x[creator] === 'function',
      false
    )
  )
}
export const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}
export const generateQueryId = (name: string, resolver: string): string =>
  `${name}-${resolver}-${uuid()}`

export const isAbsoluteUrl = (value: string): boolean =>
  regExpAbsoluteUrl.test(value)

export const isLeadingSlash = (value: string): boolean =>
  regExpLeadingSlash.test(value)

export const isString = (value: string): boolean =>
  value != null && value.constructor === String

export const isNonString = (value: string): boolean => !isString(value)

export const assertString = (value: any, name: string): void => {
  if (!isString(value)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be a string`)
  }
}

export const nonEmptyString = (value: any, name: string): void => {
  assertString(value, name)

  if (value === '') {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be a non-empty string`)
  }
}

export const leadingSlash = (value: any, name: string): void => {
  if (!isLeadingSlash(value)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must have leading "/"`)
  }
}

export const arrayOfString = (value: any, name: string): void => {
  if (!Array.isArray(value) || value.find(isNonString)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be an Array<String>`)
  }
}
