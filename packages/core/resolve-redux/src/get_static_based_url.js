import getRootBasedUrl from './get_root_based_url'
import * as validate from './validate'
import { isAbsoluteUrl } from './utils'

const getStaticBasedUrl = (origin, rootPath, staticPath, path) => {
  validate.string(path, 'Path')
  validate.nonEmptyString(staticPath, 'Static path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  validate.leadingSlash(path, 'Path')

  if (isAbsoluteUrl(staticPath)) {
    return `${staticPath}${path}`
  }

  return getRootBasedUrl(origin, rootPath, `/${staticPath}${path}`)
}

export default getStaticBasedUrl
