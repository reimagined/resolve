import adapterFactory, {
  SubscriptionAdapter,
} from '../../src/subscribe-adapter'
import {
  subscriptionAdapterAlreadyInitialized,
  subscriptionAdapterClosed,
  subscriptionAdapterNotInitialized,
} from '../../src/subscribe-adapter-constants'
import { SubscriptionAdapterStatus } from '../../src/types'

let ws: {
  readyState: number
  onopen: Function
  onmessage: Function
  send: jest.Mock
  close: jest.Mock
}
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
