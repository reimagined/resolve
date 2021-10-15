import Url from 'url'

export const validatePath = (
  url: string,
  {
    allowEmptyPath,
    allowAbsolutePath,
  }: { allowEmptyPath?: boolean; allowAbsolutePath?: boolean } = {}
) => {
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
      query,
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
