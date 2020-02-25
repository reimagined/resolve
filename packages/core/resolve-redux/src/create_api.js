import unfetch from 'unfetch'
import { URLSearchParams } from 'url'

import getRootBasedUrl from './get_root_based_url'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'
import { isString } from './utils'

export class ApiError extends Error {
  constructor(error) {
    super()
    for (let key in error) {
      if (!error.hasOwnProperty(key)) {
        continue
      }
      this[key] = error[key]
    }
  }
}

export class FetchError extends ApiError {
  constructor(error) {
    super(error)
    this.name = 'FetchError'
  }
}

export class HttpError extends ApiError {
  constructor(error) {
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
  507, // Insufficient Storage
  509, // Bandwidth Limit Exceeded
  521, // Web Server Is Down
  522, // Connection Timed Out
  523, // Origin Is Unreachable
  524 // A Timeout Occurred
]

const allowedQueryMethods = ['GET', 'POST']

const doFetch = (...args) => {
  try {
    return fetch(...args)
  } catch (err) {
    return unfetch(...args)
  }
}

const validateStatus = async response => {
  // eslint-disable-next-line eqeqeq
  if (temporaryErrorHttpCodes.find(code => code == response.status)) {
    throw new FetchError({
      code: response.status,
      message: await response.text()
    })
  }
}

const createApi = ({ origin, rootPath, jwtProvider, store, queryMethod }) => {
  if (!queryMethod || !isString(queryMethod) || !allowedQueryMethods.includes(queryMethod)) {
    throw Error(`unsupported query method [${queryMethod}], allowed ones are [${allowedQueryMethods.join(',')}]`)
  }

  const request = async (url, requestParams, method) => {
    const rootBasedUrl = getRootBasedUrl(origin, rootPath, url)

    let init = null

    switch (method) {
      case 'GET':
        init = {
          method: 'GET',
          headers: { },
          credentials: 'same-origin'
        }
        rootBasedUrl.search = new URLSearchParams(requestParams).toString()
        break
      case 'POST':
        init = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: isString(requestParams) ? requestParams : JSON.stringify(requestParams)
        }
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
    const response = await doFetch(rootBasedUrl, init)

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
    async loadViewModelState({ viewModelName, aggregateIds, aggregateArgs }) {
      let response, result
      try {
        const queryAggregateIds =
          aggregateIds === '*' ? aggregateIds : aggregateIds.join(',')

        response = await request(
          `/api/query/${viewModelName}/${queryAggregateIds}`,
          {
            aggregateArgs
          },
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
        timestamp: Number(new Date(response.headers.get('Date'))),
        result
      }
    },

    async loadReadModelState({ readModelName, resolverName, resolverArgs }) {
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
        timestamp: Number(new Date(response.headers.get('Date'))),
        result
      }
    },

    async sendCommand({ commandType, aggregateId, aggregateName, payload }) {
      let response, result
      try {
        response = await request('/api/commands', {
          type: commandType,
          aggregateId,
          aggregateName,
          payload
        }, 'POST')
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

    async getSubscribeAdapterOptions(adapterName) {
      let response, result
      try {
        response = await request('/api/subscribe', {
          origin,
          rootPath,
          adapterName
        }, 'POST')
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

    async request({ url, body }) {
      return request(url, body)
    }
  }
}

export default createApi
