import rootPath from '$resolve.rootPath'

const basename = rootPath ? `/${rootPath}` : ''

const getRootableUrl = path => {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${basename}/${path.replace(/^\//, '')}`
}

export default getRootableUrl
