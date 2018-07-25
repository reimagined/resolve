import { isLeadingSlash, isNonString, isString } from './utils'

export const string = (value, name) => {
  if (!isString(value)) {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be a string`)
  }
}

export const nonEmptyString = (value, name) => {
  string(value, name)

  if (value === '') {
    // eslint-disable-next-line
    console.error(value)
    throw new Error(`${name} must be a non-empty string`)
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
    throw new Error(`${name} must be an Array<String>`)
  }
}
