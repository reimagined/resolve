import getRootBasedUrl from './get_root_based_url'
import { isReactiveArg } from './constants'

export class FetchError extends Error {}

export class HttpError extends Error {}

const createApi = ({ origin, rootPath }) => ({
  async loadViewModelState({ viewModelName, aggregateIds, aggregateArgs }) {
    let response, result
    try {
      response = await fetch(getRootBasedUrl(origin, rootPath, '/api/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          viewModelName,
          aggregateIds,
          aggregateArgs
        })
      })
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
      const pureResolverArgs = { ...resolverArgs }
      delete pureResolverArgs[isReactiveArg]

      response = await fetch(getRootBasedUrl(origin, rootPath, '/api/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          readModelName,
          resolverName,
          resolverArgs: pureResolverArgs,
          isReactive,
          queryId
        })
      })
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

  async stopReadModelSubscription({ queryId }) {
    let response
    try {
      response = await fetch(getRootBasedUrl(origin, rootPath, '/api/query'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          stopReadModelSubscription: true
        })
      })
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
    // TODO
    return {
      appId: 'resolve',
      url: 'ws://localhost:3000/mqtt'
    }
  }
})

export default createApi
