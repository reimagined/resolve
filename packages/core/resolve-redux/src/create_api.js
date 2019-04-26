import unfetch from 'unfetch'

import getRootBasedUrl from './get_root_based_url'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'

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

const createApi = ({ origin, rootPath, jwtProvider, store }) => {
  const request = async (url, body) => {
    const rootBasedUrl = getRootBasedUrl(origin, rootPath, url)
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }

    if (jwtProvider) {
      const jwtToken = await jwtProvider.get()
      if (jwtToken) {
        options.headers.Authorization = `Bearer ${jwtToken}`
      }
    }
    const response = await doFetch(rootBasedUrl, options)

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
          }
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
          resolverArgs
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
        })
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
        })
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
