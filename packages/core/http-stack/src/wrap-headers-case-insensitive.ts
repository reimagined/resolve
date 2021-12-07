const handler: ProxyHandler<Record<string, string>> = {
  get: function (headers, key) {
    return headers[(key as string).toLowerCase()]
  },
}

const wrapHeadersCaseInsensitive = (headers: Record<string, string>): Record<string, string> =>
  new Proxy(
    Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
    ),
    handler
  )

export default wrapHeadersCaseInsensitive
