const isAbsoluteUrl = /:\/\//i

const getRootBasedUrl = (origin, rootPath, path) => {
  if (isAbsoluteUrl.test(path)) {
    return path
  }
  return `${origin}${rootPath ? `/${rootPath}` : ''}${path}`
}

export default getRootBasedUrl
