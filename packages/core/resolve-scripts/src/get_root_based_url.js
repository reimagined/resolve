const isAbsoluteUrl = /:\/\//i

const getRootBasedUrl = (rootPath, path) => {
  if (isAbsoluteUrl.test(path)) {
    return path
  }

  const basename = rootPath ? `/${rootPath}` : ''

  return `${basename}/${path.replace(/^\//, '')}`
}

export default getRootBasedUrl
