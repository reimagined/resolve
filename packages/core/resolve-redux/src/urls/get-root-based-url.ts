import { assertString, leadingSlash, isAbsoluteUrl } from '../helpers'

const getRootBasedUrl = (origin: any, rootPath: any, path: any) => {
  assertString(path, 'Path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  leadingSlash(path, 'Path')

  return `${origin}${rootPath ? `/${rootPath}` : ''}${path}`
}

export default getRootBasedUrl
