import type { IncomingHttpHeaders } from 'http'
import type { ContentType } from '../types'

import parseContentType from '../parse-content-type'

export type ParserFactory<T> = (implementation: {
  predicate: ((contentType: ContentType) => boolean) | null
  parser: (
    body: Buffer,
    contentType: string,
    parsedContentType: ContentType
  ) => Promise<T>
}) => (req: {
  body: Buffer | null
  headers: IncomingHttpHeaders
}) => Promise<T | undefined>


const parserFactory = <T>({
  predicate,
  parser,
}: {
  predicate: ((contentType: ContentType) => boolean) | null
  parser: (
    body: Buffer,
    contentType: string,
    parsedContentType: ContentType
  ) => Promise<T>
}) => ({
  body,
  headers,
}: {
  body: Buffer | null
  headers: IncomingHttpHeaders
}): Promise<T | undefined> => {
  const contentType = headers['content-type']
  if (body == null || contentType == null) {
    return Promise.resolve(undefined)
  }

  const parsedContentType = parseContentType(contentType)

  if (predicate !== null && !predicate(parsedContentType)) {
    return Promise.resolve(undefined)
  }

  return parser(body, contentType, parsedContentType)
}

export default parserFactory
