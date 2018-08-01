import jwtDecode from 'jwt-decode'
import stableStringify from 'json-stable-stringify'

import getRootBasedUrl from './get_root_based_url'
import { isReactiveArg, queryIdArg, stopSubscriptionArg } from './constants'
import { updateJwt } from './actions'

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
      options.headers.Authorization = `Bearer ${jwtToken}`
    }
    const response = await fetch(rootBasedUrl, options)

    const jwt = {}
    try {
      Object.assign(
        jwt,
        jwtDecode(
          (
            response.headers.get('Authorization') ||
            response.headers.get('authorization')
          ).replace(/^Bearer /i, '')
        )
      )
    } catch (err) {}

    if (stableStringify(store.getState().jwt) !== stableStringify(jwt)) {
      store.dispatch(updateJwt(jwt))
    }

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
        throw new HttpError(response.text())
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error.message)
      }

      return result
    },

    async loadReadModelState({
      readModelName,
      resolverName,
      resolverArgs,
      isReactive,
      queryId
    }) {
      let response, result
      try {
        response = await request(
          `/api/query/${readModelName}/${resolverName}`,
          {
            ...resolverArgs,
            ...(isReactive ? { [isReactiveArg]: isReactive } : {}),
            [queryIdArg]: queryId
          }
        )
      } catch (error) {
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(response.text())
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error.message)
      }

      return result
    },

    async stopReadModelSubscription({ readModelName, resolverName, queryId }) {
      let response
      try {
        response = await request(
          `/api/query/${readModelName}/${resolverName}`,
          {
            [stopSubscriptionArg]: true,
            [queryIdArg]: queryId
          }
        )
      } catch (error) {
        throw new FetchError(error.message)
      }

      validateStatus(response.status)

      if (!response.ok) {
        throw new HttpError(response.text())
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
        throw new HttpError(response.text())
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
        throw new HttpError(response.text())
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
