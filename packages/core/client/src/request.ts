import { getRootBasedUrl } from '@resolve-js/core'
import isomorphicFetch from 'isomorphic-fetch'
import qs, { StringifyOptions } from 'query-string'
import { Context } from './context'
import { isString } from './utils'
import determineOrigin from './determine-origin'
import { GenericError } from './errors'
import { ClientMiddlewareOptions, requestWithMiddleware } from './middleware'

export const VALIDATED_RESULT = Symbol('VALIDATED_RESULT')
export type NarrowedResponse = {
  ok: boolean
  headers: {
    get: (name: string) => string | null
  }
  json: () => Promise<any>
  text: () => Promise<string>
  [VALIDATED_RESULT]?: any
}
type ResponseValidator = (
  response: NarrowedResponse,
  confirm: (result: any) => void
) => Promise<void>
export type FetchFunction = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response & NarrowedResponse>

let cachedFetch: FetchFunction | null = null

const determineFetch = (context: Context): FetchFunction => {
  if (context.fetch) {
    return context.fetch as FetchFunction
  }
  if (!cachedFetch) {
    cachedFetch = typeof fetch === 'function' ? fetch : isomorphicFetch
  }
  return cachedFetch
}

export type RequestOptions = {
  method?: 'GET' | 'POST'
  retryOnError?: {
    errors: number[] | number
    attempts: number
    period: number
  }
  waitForResponse?: {
    validator: ResponseValidator
    attempts: number
    period: number
  }
  debug?: boolean
  middleware?: ClientMiddlewareOptions
  queryStringOptions?: StringifyOptions
}

const stringifyUrl = (
  url: string,
  params: any,
  options: StringifyOptions = {}
): string => {
  if (params) {
    if (isString(params)) {
      return `${url}?${params}`
    }
    return `${url}?${qs.stringify(
      params,
      Object.assign(
        {
          arrayFormat: 'bracket',
        },
        options
      )
    )}`
  }
  return url
}

export const request = async (
  context: Context,
  url: string,
  requestParams: any,
  options?: RequestOptions,
  deserializer?: (state: string) => any
): Promise<NarrowedResponse> => {
  const { origin, rootPath, jwtProvider } = context
  const rootBasedUrl = getRootBasedUrl(rootPath, url, determineOrigin(origin))

  const headers: { [key: string]: string } = {}
  let requestUrl: string
  let init: RequestInit

  switch (options?.method ?? 'POST') {
    case 'GET':
      init = {
        method: 'GET',
        credentials: 'same-origin',
      }
      requestUrl = stringifyUrl(
        rootBasedUrl,
        requestParams,
        options?.queryStringOptions
      )
      break
    case 'POST':
      init = {
        method: 'POST',
        credentials: 'same-origin',
        body:
          typeof requestParams === 'string'
            ? requestParams
            : JSON.stringify(requestParams),
      }
      headers['Content-Type'] = 'application/json'
      requestUrl = rootBasedUrl
      break
    default:
      throw new GenericError(`unsupported request method`)
  }

  let response: NarrowedResponse

  init.headers = headers

  const middlewareResponse = await requestWithMiddleware(
    {
      fetch: determineFetch(context),
      info: requestUrl,
      init,
      jwtProvider,
      deserializer,
    },
    options?.middleware
  )
  if (middlewareResponse instanceof Error) {
    throw middlewareResponse
  }
  response = {
    ok: !(middlewareResponse.result instanceof Error),
    headers: middlewareResponse.headers,
    [VALIDATED_RESULT]: middlewareResponse.result,
    json: () => Promise.resolve(middlewareResponse.result),
    text: () => Promise.resolve(middlewareResponse.result),
  }

  return response
}
