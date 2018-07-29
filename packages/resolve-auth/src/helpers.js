const rootPath = process.env.ROOT_PATH ? `/${process.env.ROOT_PATH}` : ''

const getRootBasedUrl = path => {
  if (/^https?:\/\//.test(path)) {
    throw new Error(`Absolute path not allowed: ${path}`)
  }
  return `${rootPath}/${path.replace(/^\//, '')}`
}

export { getRootBasedUrl }
