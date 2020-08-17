import { put, delay } from 'redux-saga/effects'

import { CONNECT_VIEWMODEL } from './action_types'
const RECONNECT_CHECK_FREQUENCY = 10

const eventInjectSaga = function*(
  {
    sagaKey,
    sagaManager,
    store,
    subscriber: createSubscriber,
    viewModels,
    api
  },
  connectAction
) {
  const { viewModelName, aggregateIds } = connectAction

  const viewModel = viewModels.find(({ name }) => name === viewModelName)
  const eventTypes = Object.keys(viewModel.projection).filter(
    eventType => eventType !== 'Init'
  )

  const subscriptionKeys = eventTypes.reduce((acc, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [])

  const topics = subscriptionKeys.map(({ eventType, aggregateId }) => ({
    topicName: eventType,
    topicId: aggregateId
  }))

  const eventsBuffer = []
  const onEvent = event => eventsBuffer.push(event)

  try {
    const { url: subscriptionUrl } = yield api.getSubscribeAdapterOptions({
      viewModelName,
      topics
    })
    const subscriber = createSubscriber({
      url: subscriptionUrl,
      onEvent
    })

    const maybeCloseSubscriber = async () => {
      try {
        await subscriber.close()
      } catch (e) {}
    }

    yield subscriber.init()
    let timerId = setTimeout(maybeCloseSubscriber, 1500)
    let iteration = 0

    while (true) {
      if (iteration === RECONNECT_CHECK_FREQUENCY - 1) {
        if (!subscriber.isConnected()) {
          throw new Error('Reconnect')
        }

        clearTimeout(timerId)
        timerId = setTimeout(maybeCloseSubscriber, 1500)
      }

      iteration = (iteration + 1) % RECONNECT_CHECK_FREQUENCY

      for (const event of eventsBuffer) {
        yield put(event)
      }
      eventsBuffer.length = 0

      yield delay(100)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Websocket subscription error', error)
    yield delay(100)

    yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`, () =>
      store.dispatch({
        ...connectAction,
        skipConnectionManager: true
      })
    )
  }
}

export default eventInjectSaga
