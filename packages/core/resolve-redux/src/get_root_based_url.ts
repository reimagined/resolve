import * as validate from './validate'
import { isAbsoluteUrl } from './utils'

const getRootBasedUrl = (origin: any, rootPath: any, path: any) => {
  validate.string(path, 'Path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  validate.leadingSlash(path, 'Path')

  return `${origin}${rootPath ? `/${rootPath}` : ''}${path}`
}

export default getRootBasedUrl
