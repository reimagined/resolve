import { getEventTypes, getAggregateIds, getKey } from './utils'

const unsubscribeViewModel = (
  { adapter, viewModels, subscribers, requests },
  action
) => {
  const { viewModelName, aggregateId } = action

  subscribers.viewModels[viewModelName] = Math.max(
    (subscribers.viewModels[viewModelName] || 0) - 1,
    0
  )
  subscribers.aggregateIds[aggregateId] = Math.max(
    (subscribers.aggregateIds[aggregateId] || 0) - 1,
    0
  )

  const needChange =
    !subscribers.viewModels[viewModelName] ||
    !subscribers.aggregateIds[aggregateId]

  const key = getKey(viewModelName, aggregateId)
  delete requests[key]

  if (needChange) {
    adapter.setSubscription({
      types: getEventTypes(viewModels, subscribers),
      aggregateIds: getAggregateIds(viewModels, subscribers)
    })
  }
}

export default unsubscribeViewModel
