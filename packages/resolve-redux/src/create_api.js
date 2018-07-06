import getRootBasedUrl from './get_root_based_url'
import { isReactiveArg, queryIdArg, stopSubscriptionArg } from './constants'

export class FetchError extends Error {}

export class HttpError extends Error {}

const createApi = ({ origin, rootPath }) => ({
  async loadViewModelState({ viewModelName, aggregateIds, aggregateArgs }) {
    let response, result
    try {
      const queryAggregateIds =
        aggregateIds === '*' ? aggregateIds : aggregateIds.join(',')

      response = await fetch(
        getRootBasedUrl(
          origin,
          rootPath,
          `/api/query/${viewModelName}/${queryAggregateIds}`
        ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(aggregateArgs)
        }
      )
    } catch (error) {
      throw new FetchError(error.message)
    }

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
      response = await fetch(
        getRootBasedUrl(
          origin,
          rootPath,
          `/api/query/${readModelName}/${resolverName}`
        ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            ...resolverArgs,
            ...(isReactive ? { [isReactiveArg]: isReactive } : {}),
            [queryIdArg]: queryId
          })
        }
      )
    } catch (error) {
      throw new FetchError(error.message)
    }

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
      response = await fetch(
        getRootBasedUrl(
          origin,
          rootPath,
          `/api/query/${readModelName}/${resolverName}`
        ),
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [stopSubscriptionArg]: true,
            [queryIdArg]: queryId
          })
        }
      )
    } catch (error) {
      throw new FetchError(error.message)
    }

    if (!response.ok) {
      throw new HttpError(response.text())
    }
  },

  async sendCommand({ commandType, aggregateId, aggregateName, payload }) {
    let response
    try {
      response = await fetch(
        getRootBasedUrl(origin, rootPath, '/api/commands'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            type: commandType,
            aggregateId,
            aggregateName,
            payload
          })
        }
      )
    } catch (error) {
      throw new FetchError(error.message)
    }

    if (!response.ok) {
      throw new HttpError(response.text())
    }
  },

  async getSubscribeAdapterOptions() {
    let response, result
    try {
      response = await fetch(
        getRootBasedUrl(origin, rootPath, '/api/subscribe'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            origin,
            rootPath
          })
        }
      )
    } catch (error) {
      throw new FetchError(error.message)
    }

    if (!response.ok) {
      throw new HttpError(response.text())
    }

    try {
      result = await response.json()
    } catch (error) {
      throw new HttpError(error.message)
    }

    return result
  }
})

export default createApi
