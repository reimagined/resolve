let rootPath = $resolve.rootPath ? `/${$resolve.rootPath}` : ''

const getRootableUrl = path => {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${rootPath}/${path.replace(/^\//, '')}`
}

export default getRootableUrl
