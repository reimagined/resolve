import { rootPath } from '../resources'

const isAbsoluteUrl = /:\/\//i

const basename = rootPath ? `/${rootPath}` : ''

const getRootBasedUrl = path => {
  if (isAbsoluteUrl.test(path)) {
    return path
  }
  return `${basename}/${path.replace(/^\//, '')}`
}

export default getRootBasedUrl
