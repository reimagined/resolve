import Url from 'url'

export const isString = value => value != null && value.constructor === String

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

const validate = { nonEmptyString }

const isTrailingSlash = /\/$/i

const getClientJsPath = staticPath => {
  validate.nonEmptyString(staticPath)

  return Url.resolve(
    isTrailingSlash.test(staticPath) ? staticPath : `${staticPath}/`,
    './client.js'
  )
}

export default getClientJsPath
