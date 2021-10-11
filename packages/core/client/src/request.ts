import { getRootBasedUrl } from '@resolve-js/core'
import isomorphicFetch from 'isomorphic-fetch'
import qs, { StringifyOptions } from 'query-string'
import { Context } from './context'
import { isString } from './utils'
import determineOrigin from './determine-origin'
import { GenericError, HttpError } from './errors'
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

const insistentRequest = async (
  fetch: FetchFunction,
  info: RequestInfo,
  init: RequestInit,
  options?: RequestOptions,
  attempts = {
    error: 0,
    response: 0,
  }
): Promise<NarrowedResponse> => {
  let response

  try {
    response = await fetch(info, init)
  } catch (error) {
    throw new GenericError(error)
  }

  if (response.ok) {
    if (options?.waitForResponse) {
      let isValidated = false
      let validResult: any = null

      const confirmResult = (result: any): void => {
        isValidated = true
        validResult = result
      }

      const validator = options.waitForResponse.validator

      if (typeof validator === 'function') {
        await validator(response, confirmResult)
      }

      if (isValidated) {
        response[VALIDATED_RESULT] = validResult
        return response
      }

      const isMaxAttemptsReached =
        attempts.response >= (options?.waitForResponse?.attempts ?? 0)

      if (isMaxAttemptsReached) {
        throw new GenericError(` ${attempts.response} retries`)
      }

      if (options?.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          `Unexpected response. Attempting again #${attempts.response + 1}/${
            options?.waitForResponse?.attempts
          }.`
        )
      }

      const period = options?.waitForResponse?.period

      if (typeof period === 'number' && period > 0) {
        await new Promise((resolve) => setTimeout(resolve, period))
      }

      return insistentRequest(fetch, info, init, options, {
        ...attempts,
        response: attempts.response + 1,
      })
    }
    return response
  }

  const expectedErrors = options?.retryOnError?.errors

  if (expectedErrors) {
    const isErrorExpected =
      typeof expectedErrors === 'number'
        ? expectedErrors === response.status
        : expectedErrors.includes(response.status)
    const isMaxAttemptsReached =
      attempts.error >= (options?.retryOnError?.attempts ?? 0)

    if (isErrorExpected && !isMaxAttemptsReached) {
      if (options?.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          `Error code ${response.status} was expected. Attempting again #${
            attempts.error + 1
          }/${options?.retryOnError?.attempts}.`
        )
      }

      const period = options?.retryOnError?.period

      if (typeof period === 'number' && period > 0) {
        await new Promise((resolve) => setTimeout(resolve, period))
      }
      return insistentRequest(fetch, info, init, options, {
        ...attempts,
        error: attempts.error + 1,
      })
    }
  }

  const error = new HttpError(response.status, await response.text())

  if (options?.debug) {
    // eslint-disable-next-line no-console
    console.error(error)
  }

  throw error
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

  const middlewareFeatureToggle =
    (options?.retryOnError == null && options?.waitForResponse == null) ||
    options?.middleware != null

  if (middlewareFeatureToggle) {
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
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `Using request options waitForResponse or retryOnError is deprecated. Please, migrate to client middleware.`
    )

    const token = await jwtProvider?.get()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    init.headers = headers

    response = await insistentRequest(
      determineFetch(context),
      requestUrl,
      init,
      options
    )

    if (jwtProvider && response.headers) {
      await jwtProvider.set(response.headers.get('x-jwt') ?? '')
    }
  }

  return response
}
