import {
  viewModelCallback,
  addCallback,
  removeCallback,
  dropCallbackMap,
} from '../../src/subscribe-callback'

const restoreConnectionCallback = jest.fn()
const eventCallback = jest.fn()
const listener = {
  onEvent: eventCallback,
  onResubscribe: restoreConnectionCallback,
}
const clearMocks = (): void => {
  restoreConnectionCallback.mockClear()
  eventCallback.mockClear()
}

describe('subscribe callbacks', () => {
  const createKey = (eventType: string, aggregateId: string) => ({
    eventType,
    aggregateId,
  })

  afterEach(() => {
    dropCallbackMap()
    clearMocks()
  })

  test('single callback added and called', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback(createKey('type-1', 'id-1'), listener)
    viewModelCallback(event)
    expect(eventCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledWith(event)
  })

  test('single callback added and called #2', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback(createKey('type-1', 'id-1'), listener)
    viewModelCallback(event, false)
    expect(eventCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledWith(event)
  })

  test('connection restored callback added and called', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback(createKey('type-1', 'id-1'), listener)
    viewModelCallback(event, true)
    expect(restoreConnectionCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledTimes(0)
  })

  test('single callback removed', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }

    addCallback(createKey('type-1', 'id-1'), listener)
    removeCallback(createKey('type-1', 'id-1'), listener)
    viewModelCallback(event)

    expect(eventCallback).toBeCalledTimes(0)
  })

  test('single callback for * added', async () => {
    const event1 = { type: 'type-1', aggregateId: 'id-1' }
    const event2 = { type: 'type-1', aggregateId: 'id-2' }
    const event3 = { type: 'type-1', aggregateId: 'id-3' }
    addCallback(createKey('type-1', '*'), listener)
    viewModelCallback(event1)
    viewModelCallback(event2)
    viewModelCallback(event3)
    expect(eventCallback).toBeCalledTimes(3)
    expect(eventCallback).toBeCalledWith(event1)
    expect(eventCallback).toBeCalledWith(event2)
    expect(eventCallback).toBeCalledWith(event3)
  })

  test('multiple callbacks added', async () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const callback3 = jest.fn()

    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback1,
    })
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback2,
    })
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback3,
    })

    viewModelCallback(event)

    expect(callback1).toBeCalledTimes(1)
    expect(callback1).toBeCalledWith(event)
    expect(callback2).toBeCalledTimes(1)
    expect(callback2).toBeCalledWith(event)
    expect(callback3).toBeCalledTimes(1)
    expect(callback3).toBeCalledWith(event)
  })

  test('multiple callbacks removed', async () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const callback3 = jest.fn()

    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback1,
    })
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback2,
    })
    addCallback(createKey('type-1', 'id-1'), {
      onEvent: callback3,
    })
    removeCallback(createKey('type-1', 'id-1'), {
      onEvent: callback2,
    })
    removeCallback(createKey('type-1', 'id-1'), {
      onEvent: callback3,
    })

    viewModelCallback(event)

    expect(callback1).toBeCalledTimes(1)
    expect(callback1).toBeCalledWith(event)
    expect(callback2).toBeCalledTimes(0)
    expect(callback3).toBeCalledTimes(0)
  })
})
