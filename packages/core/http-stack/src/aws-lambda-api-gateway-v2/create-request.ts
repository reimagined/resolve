import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'

import type {
  HttpRequest,
  LambdaApiGatewayV2Request,
  LambdaApiGatewayV2RequestCloudFrontEvent,
} from '../types'
import wrapHeadersCaseInsensitive from '../wrap-headers-case-insensitive'

const createRequest = async <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  lambdaEvent: LambdaApiGatewayV2Request,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const {
    rawPath: path,
    headers: rawHeaders,
    rawQueryString: querystring = '',
    requestContext: {
      timeEpoch: requestStartTime,
      http: { sourceIp: clientIp, method: httpMethod },
    },
    body: rawBody,
    isBase64Encoded,
  } = lambdaEvent

  const originalHeaders: Record<string, string | Array<string>> = {}
  for (const [key, value] of Object.entries(rawHeaders)) {
    originalHeaders[key] = value
  }

  const headers = wrapHeadersCaseInsensitive(originalHeaders)

  const cookieHeader = headers.cookie

  const cookies =
    cookieHeader?.constructor === String ? cookie.parse(cookieHeader) : {}

  const query = parseQuery(querystring, { arrayFormat: 'bracket' }) as Record<
    string,
    string | Array<string>
  >

  const body =
    rawBody == null
      ? null
      : isBase64Encoded
      ? Buffer.from(rawBody, 'base64')
      : Buffer.from(rawBody)

  return {
    ...customParameters,
    method: httpMethod,
    query,
    path,
    headers,
    cookies,
    body,
    clientIp,
    requestStartTime,
    params: {},
  }
}

export default createRequest
