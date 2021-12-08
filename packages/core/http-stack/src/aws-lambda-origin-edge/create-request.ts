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

  const cookieHeader = headers.cookie

  const cookies =
    cookieHeader?.constructor === String ? cookie.parse(cookieHeader) : {}

  const query = parseQuery(querystring, { arrayFormat: 'bracket' }) as Record<
    string,
    string | Array<string>
  >

  const body = rawBody == null ? null : Buffer.from(rawBody, 'base64')

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
    params: {},
    lambdaOriginEdgeStartTime,
  }
}

export default createRequest