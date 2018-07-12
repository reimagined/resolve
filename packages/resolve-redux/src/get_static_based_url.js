import getRootBasedUrl from './get_root_based_url'
import isString from './is_string'
import isLeadingSlash from './is_leading_slash'
import isAbsoluteUrl from './is_absolute_url'

const getStaticBasedUrl = (origin, rootPath, staticPath, path) => {
  if (!isString(path)) {
    throw new Error('Path must be string')
  }
  if (isAbsoluteUrl(path)) {
    return path
  }
  if (!isLeadingSlash(path)) {
    throw new Error('Path must have leading "/"')
  }
  return getRootBasedUrl(origin, rootPath, `/${staticPath}${path}`)
}

export default getStaticBasedUrl
