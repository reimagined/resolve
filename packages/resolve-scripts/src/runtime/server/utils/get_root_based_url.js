import rootPath from '$resolve.rootPath'

const basename = rootPath ? `/${rootPath}` : ''

const getRootBasedUrl = path => {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${basename}/${path.replace(/^\//, '')}`
}

export default getRootBasedUrl
