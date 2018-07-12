import isString from './is_string'
import isAbsoluteUrl from './is_absolute_url'
import isLeadingSlash from './is_leading_slash'

const getRootBasedUrl = (origin, rootPath, path) => {
  if (!isString(path)) {
    throw new Error('Path must be string')
  }
  if (isAbsoluteUrl(path)) {
    return path
  }
  if (!isLeadingSlash(path)) {
    throw new Error('Path must have leading "/"')
  }
  return `${origin}${rootPath ? `/${rootPath}` : ''}${path}`
}

export default getRootBasedUrl
