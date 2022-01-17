import type { IncomingMessage } from 'http'
import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'
import { URL } from 'url'
import getRawBody from 'raw-body'

import type { HttpMethods, HttpRequest } from '../types'
import wrapHeadersCaseInsensitive from '../wrap-headers-case-insensitive'

const createRequest = async <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  req: IncomingMessage,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const { search: rawQuery = '', pathname = '' } =
    req.url == null ? {} : new URL(req.url, 'https://example.com')

  const headers = wrapHeadersCaseInsensitive(req.headers)

  const cookieHeader = headers.cookie

  const cookies =
    cookieHeader?.constructor === String ? cookie.parse(cookieHeader) : {}

  const query = parseQuery(rawQuery, {
    arrayFormat: 'bracket',
  }) as Record<string, string | Array<string>>

  const contentLength = headers['content-length']

  const body =
    contentLength == null
      ? null
      : await getRawBody(req, {
          length: contentLength,
        })

  const forwardedForHeader = headers['x-forwarded-for']

  const clientIp = Array.isArray(forwardedForHeader)
    ? forwardedForHeader.join(',')
    : forwardedForHeader

  return {
    ...customParameters,
    method: req.method as HttpMethods,
    query,
    path: pathname,
    headers,
    cookies,
    body,
    clientIp,
    params: {},
  }
}

export default createRequest
