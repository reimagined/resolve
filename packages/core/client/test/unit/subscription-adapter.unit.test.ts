import { v4 as uuidV4 } from 'uuid'
import { mocked } from 'ts-jest/utils'

import adapterFactory, {
  SubscriptionAdapter,
} from '../../src/subscribe-adapter'
import {
  subscriptionAdapterAlreadyInitialized,
  subscriptionAdapterClosed,
  subscriptionAdapterNotInitialized,
} from '../../src/subscribe-adapter-constants'
import { SubscriptionAdapterStatus } from '../../src/types'

jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

let ws: {
  readyState: number
  onopen: Function
  onmessage: Function
  send: jest.Mock
  close: jest.Mock
}

let uuidV4Mock = mocked(uuidV4)

beforeAll(() => {
  ws = {
    readyState: 0,
    onopen: jest.fn(),
    onmessage: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
  }
  global.WebSocket = jest.fn(() => ws) as any
})

let adapter: SubscriptionAdapter
let onEvent: jest.Mock

beforeEach(() => {
  onEvent = jest.fn()
  adapter = adapterFactory({
    url: 'url',
    cursor: 'A',
    onEvent,
  })
})

afterEach(() => {
  uuidV4Mock.mockClear()
})

describe('construction', () => {
  test('status "initializing" after creation', () => {
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Initializing)
  })
})

describe('init', () => {
  test('status "connecting" after init', () => {
    adapter.init()
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Connecting)
  })

  test('status "connected" after connection opened', () => {
    adapter.init()
    ws.onopen()
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Connected)
  })

  test('status "ready" if connected and underlying connection ready', () => {
    adapter.init()
    ws.onopen()
    ws.readyState = 1
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Ready)
  })

  test('error if adapter already in "connecting" status', () => {
    adapter.init()
    expect(adapter.init).toThrow(subscriptionAdapterAlreadyInitialized)
  })

  test('error if adapter already in "connected" status', () => {
    adapter.init()
    ws.onopen()
    expect(adapter.init).toThrow(subscriptionAdapterAlreadyInitialized)
  })

  test('error if adapter closed (disposed)', () => {
    adapter.init()
    ws.onopen()
    adapter.close()
    expect(adapter.init).toThrow(subscriptionAdapterClosed)
  })
})

describe('messaging', () => {
  const events = [
    {
      threadCounter: 0,
      threadId: 0,
      type: 'ItemUpdated',
      timestamp: 1,
      aggregateId: 'test-aggregate',
      aggregateVersion: 0,
      payload: {
        isUpdated: true,
      },
    },
    {
      threadCounter: 1,
      threadId: 0,
      type: 'ItemUpdated',
      timestamp: 2,
      aggregateId: 'test-aggregate',
      aggregateVersion: 1,
      payload: {
        isUpdated: true,
      },
    },
  ]

  test('sends "pullEvents" message on connection open', () => {
    uuidV4Mock.mockReturnValueOnce('test-id-1')

    adapter.init()
    ws.onopen()

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        cursor: 'A',
        requestId: 'test-id-1',
      })
    )
  })

  test('calls onEvent with pulled events', () => {
    uuidV4Mock.mockReturnValueOnce('test-id-1')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        payload: {
          cursor: 'B',
          events,
        },
      }),
    })

    expect(onEvent).toBeCalledWith(events[0])
    expect(onEvent).toBeCalledWith(events[1])
  })

  test('pulls event on event message with new cursor', () => {
    uuidV4Mock.mockReturnValueOnce('test-id-1').mockReturnValueOnce('test-id-2')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        payload: {
          cursor: 'B',
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'event',
        event: [events[1]],
      }),
    })

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        cursor: 'B',
        requestId: 'test-id-2',
      })
    )
  })
})

describe('close', () => {
  test('status "closed" after closing connecting adapter', () => {
    adapter.init()
    adapter.close()
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Closed)
  })

  test('status "closed" after closing connected adapter', () => {
    adapter.init()
    ws.onopen()
    adapter.close()
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Closed)
  })

  test('error if adapter not initialized', () => {
    expect(adapter.close).toThrow(subscriptionAdapterNotInitialized)
  })

  test('error if adapter already closed', () => {
    expect(adapter.close).toThrow(subscriptionAdapterNotInitialized)
  })

  test('status "closed" after closing connected adapter', () => {
    adapter.init()
    ws.onopen()
    adapter.close()
    expect(adapter.close).toThrow(subscriptionAdapterNotInitialized)
  })
})
