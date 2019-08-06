import eventListenerSaga from '../src/event_listener_saga'
import { aggregateVersionsMap, lastTimestampMap } from '../src/constants'
import getHash from '../src/get_hash'

describe('Regression test. eventListenerSaga', () => {
  test('should works correctly when take expected event', () => {
    const viewModels = null
    const sagaKey = null
    const sagaManager = null
    const eventTypes = null
    const store = null
    const connectAction = {
      viewModelName: 'viewModelName',
      aggregateIds: ['id1', 'id2'],
      aggregateArgs: {}
    }

    const key = `${connectAction.viewModelName}${getHash(
      connectAction.aggregateIds
    )}${getHash(connectAction.aggregateArgs)}`

    const event = {
      aggregateId: 'id1',
      aggregateVersion: 1,
      timestamp: 1
    }

    const saga = eventListenerSaga(
      {
        viewModels,
        sagaKey,
        sagaManager,
        eventTypes,
        store
      },
      connectAction
    )

    saga.next()

    saga.next({ message: event })

    const result = saga.next({
      viewModels: {
        [aggregateVersionsMap]: {
          [key]: {}
        },
        [lastTimestampMap]: {
          [key]: 0
        }
      }
    }).value.payload.action

    expect(result).toEqual(event)
  })

  test('should works correctly when take not expected event', () => {
    const viewModels = null
    const sagaKey = null
    const sagaManager = null
    const eventTypes = null
    const store = null
    const connectAction = {
      viewModelName: 'viewModelName',
      aggregateIds: ['id1', 'id2'],
      aggregateArgs: {}
    }

    const key = `${connectAction.viewModelName}${getHash(
      connectAction.aggregateIds
    )}${getHash(connectAction.aggregateArgs)}`

    const event = {
      aggregateId: 'id2',
      aggregateVersion: 1,
      timestamp: 1
    }

    const saga = eventListenerSaga(
      {
        viewModels,
        sagaKey,
        sagaManager,
        eventTypes,
        store
      },
      connectAction
    )

    saga.next()

    saga.next({ message: event })

    const result = (
      saga.next({
        viewModels: {
          [aggregateVersionsMap]: {
            [key]: {}
          },
          [lastTimestampMap]: {
            [key]: 2
          }
        }
      }).value.PUT || {}
    ).action

    expect(result).not.toEqual(event)
  })
})
