import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'

import type { HttpRequest, LambdaOriginEdgeRequest } from '../types'
import wrapHeadersCaseInsensitive from '../wrap-headers-case-insensitive'

const createRequest = async <
  CustomParameters extends { lambdaOriginEdgeStartTime: number } & Record<
    string | symbol,
    any
  > = { lambdaOriginEdgeStartTime: number }
>(
  lambdaEvent: LambdaOriginEdgeRequest,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const {
    uri: path,
    httpMethod,
    headers: rawHeaders,
    querystring,
    body: rawBody,
    requestStartTime: lambdaOriginEdgeStartTime,
  } = lambdaEvent

  const originalHeaders = rawHeaders.reduce(
    (acc: Record<string, any>, { key, value }: { key: string; value: any }) => {
      acc[key] = value
      return acc
    },
    {}
  )

  const headers = wrapHeadersCaseInsensitive(originalHeaders)

  const cookies =
    headers.cookie != null && typeof headers.cookie === 'string'
      ? cookie.parse(headers.cookie)
      : {}

  const query = parseQuery(querystring, { arrayFormat: 'bracket' })

  const body =
    rawBody == null ? null : Buffer.from(rawBody, 'base64').toString()

  const clientIp = headers['X-Forwarded-For']

  return {
    ...customParameters,
    method: httpMethod,
    query,
    path,
    headers,
    cookies,
    body,
    clientIp,
    lambdaOriginEdgeStartTime,
  }
}

export default createRequest
