import debugLevels from 'resolve-debug-levels'
import Url from 'url'

import getRootBasedUrl from './get-root-based-url'

const log = debugLevels('resolve:resolve-runtime:getStaticBasedPath')

const validate = {
  nonEmptyString: (value, name) => {
    if (!(value != null && value.constructor === String)) {
      log.warn('Value is not a string', value)
      throw new Error(`${name} must be a string`)
    }

    if (value === '') {
      log.warn('Value is not empty string', value)
      throw new Error(`${name} must be a non-empty string`)
    }
  }
}

const getStaticBasedPath = (rootPath, staticPath, filename) => {
  validate.nonEmptyString(staticPath, 'Static path')
  validate.nonEmptyString(filename, 'Filename')

  return getRootBasedUrl(
    rootPath,
    Url.resolve(`${staticPath}/`, `./${filename}`)
  )
}

export default getStaticBasedPath
