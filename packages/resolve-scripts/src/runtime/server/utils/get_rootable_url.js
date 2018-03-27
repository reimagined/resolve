import url from 'url'

const rootPath = $resolve.rootPath

const getRootableUrl = path => {
  return url.resolve(rootPath, path)
}

export default getRootableUrl
