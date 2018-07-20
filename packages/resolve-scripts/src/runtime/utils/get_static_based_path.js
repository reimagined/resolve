import Url from 'url'

import getRootBasedUrl from './get_root_based_url'

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

const getStaticBasedPath = (rootPath, staticPath, filename) => {
  validate.nonEmptyString(staticPath, 'Static path')
  validate.nonEmptyString(filename, 'Filename')

  return getRootBasedUrl(
    rootPath,
    Url.resolve(
      isTrailingSlash.test(staticPath) ? staticPath : `${staticPath}/`,
      `./${filename}`
    )
  )
}

export default getStaticBasedPath
