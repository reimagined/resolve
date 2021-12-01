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

  const cookies =
    headers.cookie != null && typeof headers.cookie === 'string'
      ? cookie.parse(headers.cookie)
      : {}

  const query = parseQuery(rawQuery, {
    arrayFormat: 'bracket',
  })

  const body = headers.hasOwnProperty('Content-Length')
    ? await getRawBody(req, {
        length: headers['Content-Length'],
      })
    : null

  const clientIp = headers['X-Forwarded-For']

  return {
    method: req.method as HttpMethods,
    query,
    path: pathname,
    headers: req.headers,
    cookies,
    body,
    clientIp,
    ...customParameters,
  }
}

export default createRequest
