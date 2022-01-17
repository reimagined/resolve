import type { IncomingHttpHeaders } from 'http'

const handler: ProxyHandler<Record<string, string | Array<string>>> = {
  get(headers, key) {
    const normalizedKey = (key as string).toLowerCase()
    return normalizedKey in headers
      ? headers[normalizedKey]
      : headers[key as string]
  },
  set() {
    throw new TypeError()
  },
  getOwnPropertyDescriptor(headers, key) {
    const normalizedKey = (key as string).toLowerCase()
    if (normalizedKey in headers) {
      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: headers[normalizedKey],
      }
    }
  },
  has(headers, key) {
    const normalizedKey = (key as string).toLowerCase()
    return normalizedKey in headers
  },
}

const wrapHeadersCaseInsensitive = (
  headers: IncomingHttpHeaders
): IncomingHttpHeaders =>
  new Proxy(
    Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
    ),
    handler
  )

export default wrapHeadersCaseInsensitive
