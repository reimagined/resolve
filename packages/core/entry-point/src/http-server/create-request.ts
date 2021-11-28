import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'
import getRawBody from 'raw-body'
import { parse as parseUrl } from 'url'
import mimeTypes from 'mime-types'
import type { IncomingMessage } from 'http'

import type { HttpMethods, HttpRequest } from '../types'
import wrapHeadersCaseInsensitive from '../wrap-headers-case-insensitive'

const getCharset = (
  contentType: string | undefined,
  optionsEntry: string | undefined
): string => {
  if (optionsEntry != null && optionsEntry.startsWith('charset=')) {
    return optionsEntry.substring('charset='.length)
  }

  const mimeCharset =
    contentType != null ? mimeTypes.charset(contentType) : null
  return !!mimeCharset ? mimeCharset : 'latin1'
}

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

  const [contentType, optionsEntry] = headers.hasOwnProperty('Content-Type')
    ? String(headers['Content-Type'])
        .split(';')
        .map((value) => value.trim().toLowerCase())
    : []

  let charset = getCharset(contentType, optionsEntry)

  const query = parseQuery(rawQuery, {
    arrayFormat: 'bracket',
  })

  const body = headers.hasOwnProperty('Content-Length')
    ? await getRawBody(req, {
        length: headers['Content-Length'],
        encoding: charset,
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
