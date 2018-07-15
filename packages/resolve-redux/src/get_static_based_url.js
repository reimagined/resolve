import getRootBasedUrl from './get_root_based_url'
import { isAbsoluteUrl } from './utils'
import * as validate from './validate'

const getStaticBasedUrl = (origin, rootPath, staticPath, path) => {
  validate.string(path, 'Path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  validate.leadingSlash(path, 'Path')

  return getRootBasedUrl(origin, rootPath, `/${staticPath}${path}`)
}

export default getStaticBasedUrl
