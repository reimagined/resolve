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
  const browserGlobal = global as any
  browserGlobal.WebSocket = jest.fn(() => ws) as any
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
  uuidV4Mock.mockRestore()
  onEvent.mockRestore()
  ws.send.mockRestore()
  ws.close.mockRestore()
})

describe('construction', () => {
  test('status "initializing" after creation', () => {
    expect(adapter.status()).toEqual(SubscriptionAdapterStatus.Initializing)
  })
})

describe('init', () => {
  afterEach(() => {
    try {
      adapter.close()
    } catch (e) {
      // empty
    }
  })

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
  let originalConsoleWarn: typeof console.warn

  beforeEach(() => {
    jest.useFakeTimers()
    // eslint-disable-next-line no-console
    originalConsoleWarn = console.warn
    // eslint-disable-next-line no-console
    console.warn = jest.fn()
  })

  afterEach(() => {
    adapter.close()
    jest.clearAllTimers()
    // eslint-disable-next-line no-console
    console.warn = originalConsoleWarn
  })

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
    uuidV4Mock.mockReturnValueOnce('request-id-1')

    adapter.init()
    ws.onopen()

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'A',
        },
      })
    )
  })

  test('calls onEvent with pulled events', () => {
    uuidV4Mock.mockReturnValueOnce('request-id-1')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
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
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'B',
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[1]],
        },
      }),
    })

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-2',
        payload: {
          cursor: 'B',
        },
      })
    )
  })

  test('pulls events exactly once on ws connection', () => {
    uuidV4Mock.mockReturnValueOnce('request-id-1')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[1]],
        },
      }),
    })

    expect(ws.send).toBeCalledTimes(1)
  })

  test('pulls events exactly once due to ordinary work', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'B',
          events: [],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[1]],
        },
      }),
    })

    expect(ws.send).toBeCalledTimes(2)
  })

  test('waits for pullEvents message by requestId', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-5',
        payload: {
          cursor: 'B',
          events,
        },
      }),
    })

    expect(onEvent).toBeCalledTimes(0)
  })

  test('pulls events again after initial request is timed out', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')

    adapter.init()
    ws.onopen()

    expect(ws.send).toBeCalledTimes(1)

    jest.advanceTimersByTime(30000)

    expect(ws.send).toBeCalledTimes(2)

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-2',
        payload: {
          cursor: 'A',
        },
      })
    )
  })

  test('pulls events again after request is timed out', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')
      .mockReturnValueOnce('request-id-3')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'B',
          events: [],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[0]],
        },
      }),
    })

    expect(ws.send).toBeCalledTimes(2)

    jest.advanceTimersByTime(30000)

    expect(ws.send).toBeCalledTimes(3)

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-3',
        payload: {
          cursor: 'B',
        },
      })
    )
  })

  test('pulls events at most 10 times', () => {
    uuidV4Mock.mockReturnValue('request-id')

    adapter.init()
    ws.onopen()

    jest.advanceTimersByTime(10000000)

    expect(ws.send).toBeCalledTimes(10)

    // eslint-disable-next-line no-console
    expect(console.warn).toBeCalledWith(
      'WebSocket pullEvents max attempts reached out'
    )
  })

  test('pulls events again if some event are delivered while previous pulling', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')
      .mockReturnValueOnce('request-id-3')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'B',
          events: [],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[1]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-2',
        payload: {
          cursor: 'C',
          events: [events[0]],
        },
      }),
    })

    expect(ws.send).toBeCalledTimes(3)

    expect(ws.send).toBeCalledWith(
      JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-3',
        payload: {
          cursor: 'C',
        },
      })
    )
  })

  test('does not pull events infinitely if new events are not delivered', () => {
    uuidV4Mock
      .mockReturnValueOnce('request-id-1')
      .mockReturnValueOnce('request-id-2')
      .mockReturnValueOnce('request-id-3')

    adapter.init()
    ws.onopen()

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-1',
        payload: {
          cursor: 'B',
          events: [],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'events',
        payload: {
          events: [events[1]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-2',
        payload: {
          cursor: 'C',
          events: [events[0]],
        },
      }),
    })

    ws.onmessage({
      data: JSON.stringify({
        type: 'pullEvents',
        requestId: 'request-id-3',
        payload: {
          cursor: 'D',
          events: [],
        },
      }),
    })

    expect(ws.send).toBeCalledTimes(3)
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
