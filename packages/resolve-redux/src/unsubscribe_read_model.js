import { getRootableUrl } from './utils'
import actions from './actions'

const unsubscribeReadModel = (
  { origin, rootPath, store, readModelSubscriptions, orderedFetch },
  action
) => {
  const { readModelName, resolverName } = action
  const subscriptionKey = `${readModelName}:${resolverName}`
  if (!readModelSubscriptions.hasOwnProperty(subscriptionKey)) return

  const socketId = readModelSubscriptions[subscriptionKey].socketId
  delete readModelSubscriptions[subscriptionKey]

  store.dispatch(actions.dropReadModelState(readModelName, resolverName))

  if (!socketId || socketId.constructor !== String) return

  orderedFetch(
    getRootableUrl(
      origin,
      rootPath,
      `/api/query/${readModelName}/${resolverName}?socketId=${socketId}`
    ),
    {
      method: 'DELETE',
      credentials: 'same-origin'
    }
  ).catch(() => null)
}

export default unsubscribeReadModel
