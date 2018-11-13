import Url from 'url'

const validatePath = (url, { allowEmptyPath, allowAbsolutePath } = {}) => {
  if (url === '' && !allowEmptyPath) {
    return false
  }

  try {
    const {
      protocol,
      slashes,
      auth,
      host,
      port,
      hostname,
      hash,
      search,
      query
    } = Url.parse(url)

    if (
      !allowAbsolutePath &&
      (protocol || slashes || host || port || hostname)
    ) {
      return false
    }

    if (auth || hash || search || query || /^\//.test(url) || /\/$/.test(url)) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export default validatePath
