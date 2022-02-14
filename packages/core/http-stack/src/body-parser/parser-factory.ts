import type { IncomingHttpHeaders } from 'http'

import type { ContentType } from '../types'

import parseContentType from '../parse-content-type'

export type Predicate = ((contentType: ContentType) => boolean) | null
export type Parser<T = any> = (
  body: Buffer,
  contentType: string,
  parsedContentType: ContentType
) => Promise<T>

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

const parserFactory = <T, Default = undefined>(
  {
    predicate,
    parser,
  }: {
    predicate: ((contentType: ContentType) => boolean) | null
    parser: (
      body: Buffer,
      contentType: string,
      parsedContentType: ContentType
    ) => Promise<T>
  },
  defaultValue: Default = (undefined as any) as Default
) => ({
  body,
  headers,
}: {
  body: Buffer | null
  headers: IncomingHttpHeaders
}): Promise<T | Default> => {
  const contentType = headers['content-type']
  if (body == null || contentType == null) {
    return Promise.resolve(defaultValue)
  }

  const parsedContentType = parseContentType(contentType)

  if (predicate !== null && !predicate(parsedContentType)) {
    return Promise.resolve(defaultValue)
  }

  return parser(body, contentType, parsedContentType)
}

export default parserFactory
