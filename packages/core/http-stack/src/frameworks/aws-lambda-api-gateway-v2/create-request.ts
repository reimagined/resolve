import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'

import type {
  HttpRequest,
  LambdaApiGatewayV2Request,
  LambdaApiGatewayV2RequestCloudFrontEvent,
} from '../../types'
import wrapHeadersCaseInsensitive from '../../wrap-headers-case-insensitive'
import bodyParser from '../../body-parser'

const createRequest = async <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  lambdaEvent: LambdaApiGatewayV2Request,
  customParameters: CustomParameters
): Promise<HttpRequest<CustomParameters>> => {
  const {
    rawPath: path,
    headers: rawHeaders,
    rawQueryString: rawQuery,
    requestContext: {
      timeEpoch: requestStartTime,
      http: { sourceIp: clientIp, method: httpMethod },
    },
    body: encodedBody,
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

  const query = parseQuery(rawQuery ?? '', {
    arrayFormat: 'bracket',
  }) as Record<string, string | Array<string>>

  const rawBody =
    encodedBody == null
      ? undefined
      : isBase64Encoded
      ? Buffer.from(encodedBody, 'base64')
      : Buffer.from(encodedBody)
  const body = await bodyParser({ rawBody, headers })

  return {
    ...customParameters,
    method: httpMethod,
    rawQuery,
    query,
    path,
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
