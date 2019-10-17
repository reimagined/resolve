const getOrigin = () => {
  const { origin: nativeOrigin, protocol, hostname, port } = window.location
  const origin =
    nativeOrigin == null
      ? `${protocol}//${hostname}${port ? `:${port}` : ''}`
      : nativeOrigin

  return origin
}

export default getOrigin
