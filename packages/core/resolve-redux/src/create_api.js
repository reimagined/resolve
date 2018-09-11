import getRootBasedUrl from './get_root_based_url'
import syncJwtProviderWithStore from './sync_jwt_provider_with_store'

export class FetchError extends Error {}

export class HttpError extends Error {}

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

const validateStatus = status => {
  // eslint-disable-next-line eqeqeq
  if (temporaryErrorHttpCodes.find(code => code == status)) {
    throw new FetchError(status)
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
    const response = await fetch(rootBasedUrl, options)

    const responseJwtToken = (
      response.headers.get('Authorization') ||
      response.headers.get('authorization') ||
      ''
    ).replace(/^Bearer /i, '')

    if (jwtProvider) {
      await jwtProvider.set(responseJwtToken)
    }

    await syncJwtProviderWithStore(jwtProvider, store)

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
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(await response.text())
      }

      try {
        result = await response.text()
      } catch (error) {
        throw new HttpError(error.message)
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
          {
            ...resolverArgs
          }
        )
      } catch (error) {
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(await response.text())
      }

      try {
        result = await response.text()
      } catch (error) {
        throw new HttpError(error.message)
      }

      return {
        timestamp: Number(new Date(response.headers.get('Date'))),
        result
      }
    },

    async sendCommand({ commandType, aggregateId, aggregateName, payload }) {
      let response
      try {
        response = await request('/api/commands', {
          type: commandType,
          aggregateId,
          aggregateName,
          payload
        })
      } catch (error) {
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(await response.text())
      }
    },

    async getSubscribeAdapterOptions() {
      let response, result
      try {
        response = await request('/api/subscribe', {
          origin,
          rootPath
        })
      } catch (error) {
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(await response.text())
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error.message)
      }

      return result
    },

    async request({ url, body }) {
      return request(url, body)
    }
  }
}

export default createApi
