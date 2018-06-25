import { getRootBasedUrl } from './utils'

const createApi = ({ origin, rootPath }) => ({
  async loadViewModelState({ viewModelName, aggregateIds, aggregateArgs }) {
    const response = await fetch(
      getRootBasedUrl(origin, rootPath, '/api/query'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          viewModelName,
          aggregateIds,
          aggregateArgs
        })
      }
    )

    if (!response.ok) {
      throw new Error(response.text())
    }

    return await response.json()
  },

  async loadReadModelState({
    readModelName,
    resolverName,
    resolverArgs,
    queryId,
    isReactive
  }) {
    const response = await fetch(
      getRootBasedUrl(origin, rootPath, '/api/query'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          readModelName,
          resolverName,
          resolverArgs,
          queryId,
          isReactive
        })
      }
    )

    if (!response.ok) {
      throw new Error(response.text())
    }

    return await response.json()
  },

  async stopReadModelSubscription({ queryId }) {
    const response = await fetch(
      getRootBasedUrl(origin, rootPath, '/api/query'),
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          stopReadModelSubscription: true
        })
      }
    )

    if (!response.ok) {
      throw new Error(response.text())
    }
  },

  async sendCommand({ command, aggregateId, aggregateName }) {
    const response = await fetch(
      getRootBasedUrl(origin, rootPath, '/api/commands'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(command)
      }
    )

    if (!response.ok) {
      throw new Error(response.text())
    }
  },

  async getSubscribeAdapterOptions() {
    // TODO
    return {
      appId: '1234',
      url: '/mqtt'
    }
  }
})

export default createApi
