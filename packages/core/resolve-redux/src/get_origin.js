const getOrigin = location =>
  location != null
    ? location.origin == null
      ? `${location.protocol}//${location.hostname}${
          location.port ? `:${location.port}` : ''
        })`
      : location.origin
    : null

export default getOrigin
