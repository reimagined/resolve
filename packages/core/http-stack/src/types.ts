import type { CookieSerializeOptions } from 'cookie'
import type { INTERNAL } from './constants'
import type { TrieOptions } from 'route-trie'

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

export type HttpRequest<
  CustomParameters extends Record<string | symbol, any> = {}
> = {
  readonly method: HttpMethods
  readonly query: Record<string, string | Array<string>>
  readonly path: string
  readonly headers: Record<string, string>
  readonly params: Record<string, string>
  readonly cookies: Record<string, string>
  readonly body: Buffer | null
  readonly clientIp?: string
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
