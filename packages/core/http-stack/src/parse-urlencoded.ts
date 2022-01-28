import parseContentType from './parse-content-type'
import { IncomingHttpHeaders } from 'http'
import { parse as parseQuery } from 'query-string'

const parseUrlencoded = async ({
  body,
  headers,
}: {
  body: Buffer | null
  headers: IncomingHttpHeaders
}): Promise<Record<string, string | Array<string>> | null> => {
  const contentType = headers['content-type']
  if (body == null || contentType == null) {
    return null
  }

  const {
    type: mediaType,
    subType: mediaSubType,
    params: { charset = 'utf-8' },
  } = parseContentType(contentType)

  if (
    mediaType !== 'application' ||
    mediaSubType !== 'x-www-form-urlencoded' ||
    charset.toLocaleLowerCase() !== 'utf-8'
  ) {
    return null
  }

  return parseQuery(body.toString(), {
    arrayFormat: 'bracket',
  }) as Record<string, string | Array<string>>
}

export default parseUrlencoded
