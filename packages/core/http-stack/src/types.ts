import type { IncomingHttpHeaders } from 'http'
import type { CookieSerializeOptions } from 'cookie'
import type { INTERNAL } from './constants'
import getHttpStatusText from './get-http-status-text'

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
> = CustomParameters & {
  readonly method: HttpMethods
  readonly query: Record<string, any>
  readonly path: string
  readonly headers: IncomingHttpHeaders
  readonly cookies: Record<string, string>
  readonly body: Buffer
  readonly clientIp?: string
}

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
  readonly getHeader: (searchKey: string) => any
  readonly setHeader: (key: string, value: string) => HttpResponse
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
