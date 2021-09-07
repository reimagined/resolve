const isAbsoluteUrl = /:\/\//i

const getRootBasedUrl = (rootPath: string, path: string) => {
  if (isAbsoluteUrl.test(path)) {
    return path
  }

  const basename = rootPath ? `/${rootPath}` : ''

  return `${basename}/${path.replace(/^\//, '')}`
}

export default getRootBasedUrl
