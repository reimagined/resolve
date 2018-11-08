import Url from 'url'

const validatePath = (url, allowEmptyPath) => {
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
      query,
      path
    } = Url.parse(url)

    if (path === '' && !allowEmptyPath) {
      return false
    }

    if (
      protocol ||
      slashes ||
      auth ||
      host ||
      port ||
      hostname ||
      hash ||
      search ||
      query ||
      /^\//.test(path) ||
      /\/$/.test(path)
    ) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export default validatePath
