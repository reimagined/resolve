import url from 'url'

const rootPath = $resolve.rootPath // eslint-disable-line

const getRootableUrl = path => {
  return url.resolve(rootPath, path)
}

export default getRootableUrl
