import type { IncomingHttpHeaders } from 'http'

import type { ContentType } from './types'

const getContentType = (headers: IncomingHttpHeaders): ContentType => {
  const headerContentType = headers['content-type']
  if (headerContentType == null) {
    return {}
  }

  const [mediaType, ...directives] = headerContentType
    .split(';')
    .filter((value) => value != null)
    .map((value) => value.trim().toLowerCase())

  const contentType: ContentType = { mediaType }

  for (const directive of directives) {
    if (directive == null) {
      continue
    }
    const symbolIndex = directive.indexOf('=')
    if (symbolIndex === -1) {
      continue
    }
    const key = directive.slice(0, symbolIndex).trim()
    const value = directive.slice(symbolIndex + 1).trim()
    if (value === '') {
      continue
    }
    switch (key) {
      case 'charset': {
        contentType.charset = value
        break
      }
      case 'boundary': {
        contentType.boundary = value
        break
      }
    }
  }

  return contentType
}

export default getContentType
