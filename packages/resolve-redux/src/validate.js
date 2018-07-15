import { isLeadingSlash, isNonString, isString } from './utils'

export const string = (value, name) => {
  if (!isString(value)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be string`)
  }
}

export const leadingSlash = (value, name) => {
  if (!isLeadingSlash(value)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must have leading "/"`)
  }
}

export const arrayOfString = (value, name) => {
  if (!Array.isArray(value) || value.find(isNonString)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be Array<String>`)
  }
}
