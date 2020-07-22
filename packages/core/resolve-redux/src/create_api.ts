import unfetch from 'unfetch'
import qs from 'query-string'

import getRootBasedUrl from './get_root_based_url'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'
import { isString } from './utils'

export type API = {
  loadViewModelState: (p: {
    viewModelName: string
    aggregateIds: string | string[]
  }) => Promise<any>
  loadReadModelState: (p: {
    readModelName: string
    resolverName: string
    resolverArgs: any
  }) => Promise<any>
  sendCommand: (p: {
    commandType: string
    aggregateId: string
    aggregateName: string
    payload: any
  }) => Promise<any>
  getSubscribeAdapterOptions: (adapterName: string) => Promise<any>
  request: (p: { url: string; body: any; method: string }) => Promise<any>
}

export class ApiError extends Error {
  public code: number = 500
  constructor(error: any) {
    super()
    const ref = this as { [key: string]: any }
    for (const key in error) {
      if (error.hasOwnProperty(key)) {
        ref[key] = error[key]
      }
    }
  }
}

export class FetchError extends ApiError {
  constructor(error: any) {
    super(error)
    this.name = 'FetchError'
  }
}

export class HttpError extends ApiError {
  constructor(error: any) {
    super(error)
    this.name = 'HttpError'
  }
}

export const temporaryErrorHttpCodes = [
  408, // Request Timeout
  429, // Too Many Requests
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  507, // Insufficient Eventstore
  509, // Bandwidth Limit Exceeded
  521, // Web Server Is Down
  522, // Connection Timed Out
  523, // Origin Is Unreachable
  524 // A Timeout Occurred
]

const allowedQueryMethods = ['GET', 'POST']

const doFetch = (input: any, init: any) => {
  try {
    return fetch(input, init)
  } catch (err) {
    return unfetch(input, init)
  }
}

const validateStatus = async (response: any) => {
  // eslint-disable-next-line eqeqeq
  if (temporaryErrorHttpCodes.find(code => code == response.status)) {
    throw new FetchError({
      code: response.status,
      message: await response.text()
    })
  }
}

const stringifyUrl = (url: string, params: any) => {
  if (params) {
    if (isString(params)) {
      return `${url}?${params}`
    }
    return `${url}?${qs.stringify(params, {
      arrayFormat: 'bracket'
    })}`
  }
  return url
}

const createApi = ({
  origin,
  rootPath,
  jwtProvider,
  store,
  queryMethod = 'GET'
}: {
  origin?: any
  rootPath: any
  jwtProvider?: any
  store?: any
  queryMethod: string
}): API => {
  if (
    !queryMethod ||
    !isString(queryMethod) ||
    !allowedQueryMethods.includes(queryMethod)
  ) {
    throw Error(
      `unsupported query method [${queryMethod}], allowed ones are [${allowedQueryMethods.join(
        ','
      )}]`
    )
  }

  const request = async (url: string, requestParams: any, method: string) => {
    const rootBasedUrl = getRootBasedUrl(origin, rootPath, url)

    let requestUrl = null
    let init = null

    switch (method) {
      case 'GET':
        init = {
          method: 'GET',
          headers: {
            Authorization: ''
          },
          credentials: 'same-origin'
        }
        requestUrl = stringifyUrl(rootBasedUrl, requestParams)
        break
      case 'POST':
        init = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: isString(requestParams)
            ? requestParams
            : JSON.stringify(requestParams)
        }
        requestUrl = rootBasedUrl
        break
      default:
        throw Error(`unsupported request method [${method}]`)
    }
    if (jwtProvider) {
      const jwtToken = await jwtProvider.get()
      if (jwtToken) {
        init.headers.Authorization = `Bearer ${jwtToken}`
      }
    }
    const response = await doFetch(requestUrl, init)

    if (jwtProvider) {
      const responseJwtToken = response.headers.get('x-jwt')
      await jwtProvider.set(responseJwtToken)
    }
    syncJwtProviderWithStore(jwtProvider, store).catch(
      // eslint-disable-next-line no-console
      error => console.error(error)
    )

    return response
  }

  return {
    async loadViewModelState({
      viewModelName,
      aggregateIds
    }: {
      viewModelName: string
      aggregateIds: string | string[]
    }) {
      let response, result
      try {
        const queryAggregateIds =
          typeof aggregateIds === 'string'
            ? aggregateIds
            : aggregateIds.join(',')

        response = await request(
          `/api/query/${viewModelName}/${queryAggregateIds}`,
          {},
          queryMethod
        )
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.text()
      } catch (error) {
        throw new HttpError(error)
      }

      return {
        timestamp: Number(new Date(response.headers.get('Date') || 0)),
        result
      }
    },

    async loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs
    }: {
      readModelName: string
      resolverName: string
      resolverArgs: any
    }) {
      let response, result
      try {
        response = await request(
          `/api/query/${readModelName}/${resolverName}`,
          resolverArgs,
          queryMethod
        )
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.text()
      } catch (error) {
        throw new HttpError(error)
      }

      return {
        timestamp: Number(new Date(response.headers.get('Date') || 0)),
        result
      }
    },

    async sendCommand({
      commandType,
      aggregateId,
      aggregateName,
      payload
    }: {
      commandType: string
      aggregateId: string
      aggregateName: string
      payload: any
    }) {
      let response, result
      try {
        response = await request(
          '/api/commands',
          {
            type: commandType,
            aggregateId,
            aggregateName,
            payload
          },
          'POST'
        )
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error)
      }

      return result
    },

    async getSubscribeAdapterOptions(adapterName: string) {
      let response, result
      try {
        response = await request(
          '/api/subscribe',
          {
            origin,
            rootPath,
            adapterName
          },
          'POST'
        )
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error)
      }

      return result
    },

    async request({
      url,
      body,
      method
    }: {
      url: string
      body: any
      method: string
    }) {
      return request(url, body, method == null ? queryMethod : method)
    }
  }
}

export default createApi
