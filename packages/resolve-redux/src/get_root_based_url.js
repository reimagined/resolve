const getRootBasedUrl = (origin, rootPath, url) => {
  return `${origin}${rootPath ? `/${rootPath}` : ''}${url}`
}

export default getRootBasedUrl
