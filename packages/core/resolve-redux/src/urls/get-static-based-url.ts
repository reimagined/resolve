import getRootBasedUrl from './get-root-based-url'
import { isAbsoluteUrl, string, nonEmptyString, leadingSlash } from '../helpers'

const getStaticBasedUrl = (
  origin: any,
  rootPath: any,
  staticPath: any,
  path: any
) => {
  string(path, 'Path')
  nonEmptyString(staticPath, 'Static path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  leadingSlash(path, 'Path')

  if (isAbsoluteUrl(staticPath)) {
    return `${staticPath}${path}`
  }

  return getRootBasedUrl(origin, rootPath, `/${staticPath}${path}`)
}

export default getStaticBasedUrl
