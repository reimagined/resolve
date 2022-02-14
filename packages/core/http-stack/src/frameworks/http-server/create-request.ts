import type { IncomingMessage } from 'http'
import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'
import { URL } from 'url'
import getRawBody from 'raw-body'

import type { HttpMethods, HttpRequest } from '../../types'
import wrapHeadersCaseInsensitive from '../../wrap-headers-case-insensitive'
import bodyParser from '../../body-parser'

const createRequest = async <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  req: IncomingMessage,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const requestStartTime = Date.now()

  const { search, pathname = '' } =
    req.url == null
      ? { search: undefined, pathname: undefined }
      : new URL(req.url, 'https://example.com')
  const rawQuery = search === '' ? undefined : search

  const headers = wrapHeadersCaseInsensitive(req.headers)

  const cookieHeader = headers.cookie

  const cookies =
    cookieHeader?.constructor === String ? cookie.parse(cookieHeader) : {}

  const query = parseQuery(rawQuery ?? '', {
    arrayFormat: 'bracket',
  }) as Record<string, string | Array<string>>

  const contentLength = headers['content-length']

  const rawBody =
    contentLength == null
      ? undefined
      : await getRawBody(req, {
          length: contentLength,
        })
  const body = await bodyParser({ rawBody, headers })

  const forwardedForHeader = headers['x-forwarded-for']

  const clientIp = Array.isArray(forwardedForHeader)
    ? forwardedForHeader.join(',')
    : forwardedForHeader

  return {
    ...customParameters,
    method: req.method as HttpMethods,
    rawQuery,
    query,
    path: pathname,
    headers,
    cookies,
    rawBody,
    body,
    clientIp,
    requestStartTime,
    params: {},
  }
}

export default createRequest
