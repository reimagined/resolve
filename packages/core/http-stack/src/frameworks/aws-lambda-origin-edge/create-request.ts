import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'

import type { HttpRequest, LambdaOriginEdgeRequest } from '../../types'
import wrapHeadersCaseInsensitive from '../../wrap-headers-case-insensitive'
import bodyParser from '../../body-parser'

const createRequest = async <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  lambdaEvent: LambdaOriginEdgeRequest,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const {
    uri: path,
    httpMethod,
    headers: rawHeaders,
    querystring: rawQuery,
    body: encodedBody,
    requestStartTime,
  } = lambdaEvent

  const originalHeaders: Record<string, string | Array<string>> = {}
  for (const { key, value } of rawHeaders) {
    originalHeaders[key] = value
  }

  const headers = wrapHeadersCaseInsensitive(originalHeaders)

  const cookieHeader = headers.cookie

  const cookies =
    cookieHeader?.constructor === String ? cookie.parse(cookieHeader) : {}

  const query = parseQuery(rawQuery ?? '', {
    arrayFormat: 'bracket',
  }) as Record<string, string | Array<string>>

  const rawBody =
    encodedBody == null ? undefined : Buffer.from(encodedBody, 'base64')
  const body = await bodyParser({ rawBody, headers })

  const forwardedForHeader = headers['x-forwarded-for']

  const clientIp = Array.isArray(forwardedForHeader)
    ? forwardedForHeader.join(',')
    : forwardedForHeader

  return {
    ...customParameters,
    method: httpMethod,
    rawQuery,
    query,
    path,
    headers,
    cookies,
    body,
    rawBody,
    clientIp,
    requestStartTime,
    params: {},
  }
}

export default createRequest
