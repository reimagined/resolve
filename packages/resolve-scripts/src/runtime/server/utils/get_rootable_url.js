let rootPath = $resolve.rootPath ? `/${$resolve.rootPath}` : ''

const getRootableUrl = path => {
  return `${rootPath}/${path.replace(/^\//, '')}`
}

export default getRootableUrl
