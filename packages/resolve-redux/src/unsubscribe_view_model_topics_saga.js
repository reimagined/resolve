import { take, put } from 'redux-saga/effects'

import { unsubscribeTopicRequest } from './actions'
import {
  UNSUBSCRIBE_TOPIC_FAILURE,
  UNSUBSCRIBE_TOPIC_SUCCESS
} from './action_types'

const unsubscribeViewModelTopicsSaga = function*({
  viewModels,
  viewModelName,
  aggregateIds
}) {
  const viewModel = viewModels.find(({ name }) => name === viewModelName)
  const eventTypes = Object.keys(viewModel.projection).filter(
    eventType => eventType !== 'Init'
  )

  let subscriptionKeys = eventTypes.reduce((acc, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [])

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(unsubscribeTopicRequest(eventType, aggregateId))
    }

    while (counter > 0) {
      const unsubscribeResultAction = yield take(
        // eslint-disable-next-line no-loop-func
        action =>
          (action.type === UNSUBSCRIBE_TOPIC_SUCCESS ||
            action.type === UNSUBSCRIBE_TOPIC_FAILURE) &&
          subscriptionKeys.find(
            key =>
              key.aggregateId === action.topicId &&
              key.eventType === action.topicName
          )
      )

      if (unsubscribeResultAction.type === UNSUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === unsubscribeResultAction.topicId &&
              key.eventType === unsubscribeResultAction.topicName
            )
        )
      }

      counter--
    }
  }
}

export default unsubscribeViewModelTopicsSaga
