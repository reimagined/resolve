import type { IncomingHttpHeaders } from 'http'
import type { CookieSerializeOptions } from 'cookie'
import type { TrieOptions } from 'route-trie'

import type { INTERNAL } from './constants'

export type OnStartCallback<
  CustomParameters extends Record<string | symbol, any> = {}
> = (
  timestamp: number,
  req: HttpRequest<CustomParameters>,
  res: HttpResponse
) => void

export type OnFinishCallback<
  CustomParameters extends Record<string | symbol, any> = {}
> = (
  timestamp: number,
  req: HttpRequest<CustomParameters>,
  res: HttpResponse,
  error?: any
) => void

export type CORS = {
  origin?: boolean | string | RegExp | Array<string>
  methods?: '*' | Array<HttpMethods>
  allowedHeaders?: Array<string>
  exposedHeaders?: Array<string>
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

export type Route<
  CustomParameters extends Record<string | symbol, any> = {}
> = {
  pattern: string
  method: HttpMethods
  middlewares?: Array<
    (
      req: HttpRequest<CustomParameters>,
      res: HttpResponse,
      next: () => void
    ) => Promise<void> | void
  >
  handler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void> | void
  optional?: boolean
}

export type RouterOptions<
  CustomParameters extends Record<string | symbol, any> = {}
> = {
  routes: Array<Route<CustomParameters>>
  cors?: CORS
  options?: TrieOptions
  notFoundHandler?: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void> | void
}

export type HttpMethods =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'

export type ContentType = {
  type: string
  subType: string
  params: Record<string, string>
}

export type MultipartDataFile = {
  content: Buffer
  fieldName: string
  encoding: string
  mimeType: string
  fileName?: string
}

export type MultipartDataFiles = Array<MultipartDataFile>

export type MultipartDataFields = Record<string, string>

export type MultipartData = {
  files: MultipartDataFiles
  fields: MultipartDataFields
}

export type UrlencodedData = Record<string, string | Array<string>>

export type HttpRequest<
  CustomParameters extends Record<string | symbol, any> = {}
> = {
  readonly method: HttpMethods
  readonly query: Record<string, string | Array<string>>
  readonly path: string
  readonly headers: IncomingHttpHeaders
  readonly params: Record<string, string>
  readonly cookies: Record<string, string>
  readonly body: Buffer | null
  readonly clientIp?: string
  readonly requestStartTime: number
} & CustomParameters

export type HttpResponse = {
  [INTERNAL]: InternalResponse

  readonly cookie: (
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly clearCookie: (
    name: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly status: (code: number) => HttpResponse
  readonly redirect: (path: string, code?: number) => HttpResponse
  readonly getHeader: (key: string) => any
  readonly setHeader: (key: string, value: string) => HttpResponse
  readonly addVaryHeader: (key: string) => HttpResponse
  readonly text: (content: string, encoding?: BufferEncoding) => HttpResponse
  readonly json: (content: any) => HttpResponse
  readonly end: (
    content?: string | Buffer,
    encoding?: BufferEncoding
  ) => HttpResponse
  readonly file: (
    content: string | Buffer,
    filename: string,
    encoding?: BufferEncoding
  ) => HttpResponse
}

export type InternalResponse = {
  status: number
  headers: Array<[string, string]>
  cookies: Array<string>
  varyHeaderKeys: Set<string>
  body: string | Buffer
  closed: boolean
}

export type LambdaOriginEdgeRequest = {
  httpMethod: HttpMethods
  headers: Array<{ key: string; value: any }>
  querystring: string
  uri: string
  body: string | null
  requestStartTime: number
}

export type LambdaOriginEdgeResponse = {
  httpStatus: number
  httpStatusText: string
  headers: Array<{
    key: string
    value: string
  }>
  body: string
}

export type LambdaApiGatewayV2RequestCloudFrontEvent = {
  context: {
    distributionId: string
    eventType: 'viewer-request'
    requestId: string
  }
  viewer: {
    ip: string
  }
  request: {
    method: HttpMethods
    uri: string
    headers: {
      'user-agent'?: {
        value: string
      }
      'sec-ch-ua-mobile'?: {
        value: string
      }
      host?: {
        value: string
      }
      accept?: {
        value: string
      }
      'upgrade-insecure-requests'?: {
        value: string
      }
      'sec-fetch-site'?: {
        value: string
      }
      'sec-fetch-dest'?: {
        value: string
      }
      'accept-language'?: {
        value: string
      }
      'accept-encoding'?: {
        value: string
      }
      'sec-ch-ua-platform'?: {
        value: string
      }
      'sec-fetch-user'?: {
        value: string
      }
      'sec-ch-ua'?: {
        value: string
      }
      'sec-fetch-mode'?: {
        value: string
      }
    } & Record<string, { value: string }>
    cookies: Record<string, { value: string } & Record<string, string>>
  }
}

export type LambdaApiGatewayV2Request = {
  version: '2.0'
  routeKey: string
  rawPath: string
  rawQueryString?: string
  headers: {
    accept?: string
    'accept-encoding'?: string
    'content-length'?: string
    host?: string
    'user-agent'?: string
    via?: string
    // eslint-disable-next-line spellcheck/spell-checker
    'x-amz-cf-id'?: string
    // eslint-disable-next-line spellcheck/spell-checker
    'x-amzn-trace-id'?: string
    'x-cloudfront-event'?: string
    'x-forwarded-for'?: string
    'x-forwarded-port'?: string
    'x-forwarded-proto'?: string
  } & Record<string, string>
  requestContext: {
    accountId: string
    apiId: string
    domainName: string
    domainPrefix: string
    http: {
      method: HttpMethods
      path: string
      protocol: string
      sourceIp: string
      userAgent: string
    }
    requestId: string
    routeKey: string
    stage: string
    time: string
    timeEpoch: number
  }
  pathParameters: { wildcard: string }
  body: string | undefined
  isBase64Encoded: boolean
}

export type LambdaApiGatewayV2Response = {}
