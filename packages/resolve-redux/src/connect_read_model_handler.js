import { delay, getRootBasedUrl } from './utils'
import actions from './actions'

const connectReadModelHandler = (
  { origin, rootPath, store, readModelSubscriptions, adapter, orderedFetch },
  action
) => {
  const { readModelName, resolverName, parameters, isReactive } = action

  const subscriptionKey = `${readModelName}:${resolverName}`
  if (readModelSubscriptions.hasOwnProperty(subscriptionKey)) {
    return
  }

  const fetchReadModel = () => {
    if (!readModelSubscriptions.hasOwnProperty(subscriptionKey)) {
      return
    }
    const checkSelfPromise = selfPromise => {
      return (
        readModelSubscriptions.hasOwnProperty(subscriptionKey) &&
        selfPromise === readModelSubscriptions[subscriptionKey].promise
      )
    }

    const selfPromise = Promise.resolve().then(async () => {
      try {
        if (!checkSelfPromise(selfPromise)) {
          return
        }
        const socketId = await adapter.getClientId()
        readModelSubscriptions[subscriptionKey].socketId = socketId

        if (!checkSelfPromise(selfPromise)) {
          return
        }

        const response = await orderedFetch(
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
              isReactive,
              socketId,
              parameters
            })
          }
        )
        if (!response.ok) {
          throw new Error()
        }
        const { result, timeToLive, serialId } = await response.json()

        if (!checkSelfPromise(selfPromise)) return
        store.dispatch(
          actions.loadReadModelInitialState(
            readModelName,
            resolverName,
            result,
            serialId
          )
        )

        if (!isReactive) {
          return
        }

        await delay(timeToLive)
        fetchReadModel()
      } catch (error) {
        await delay(1000)
        fetchReadModel()
      }
    })

    readModelSubscriptions[subscriptionKey].promise = selfPromise
  }

  readModelSubscriptions[subscriptionKey] = {
    promise: Promise.resolve(),
    refresh: fetchReadModel,
    socketId: null
  }

  fetchReadModel()
}

export default connectReadModelHandler
