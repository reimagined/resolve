let rootPath = $resolve.rootPath ? `/${$resolve.rootPath}` : ''

const getRootBasedUrl = path => {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${rootPath}/${path.replace(/^\//, '')}`
}

export default getRootBasedUrl
