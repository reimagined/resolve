import type { IncomingHttpHeaders } from 'http'

import normalizeKey from './normalize-key'

const wrapHeadersCaseInsensitive = (
  headersMap: IncomingHttpHeaders
): Record<string, any> =>
  Object.create(
    Object.prototype,
    Object.keys(headersMap).reduce((acc: Record<string, any>, key) => {
      const value = headersMap[key]
      const [upperDashKey, dashKey, lowerKey] = [
        normalizeKey(key, 'upper-dash-case'),
        normalizeKey(key, 'dash-case'),
        normalizeKey(key, 'lower-case'),
      ]

      acc[upperDashKey] = { value, enumerable: true }
      if (upperDashKey !== dashKey) {
        acc[dashKey] = { value, enumerable: false }
      }
      acc[lowerKey] = { value, enumerable: false }

      return acc
    }, {})
  )

export default wrapHeadersCaseInsensitive
