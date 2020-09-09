import {
  rootCallback,
  addCallback,
  removeCallback,
  dropCallbackMap,
} from '../../src/subscribe-callback'

const restoreConnectionCallback = jest.fn()
const eventCallback = jest.fn()
const clearMocks = (): void => {
  restoreConnectionCallback.mockClear()
  eventCallback.mockClear()
}

describe('subscribe callbacks', () => {
  afterEach(() => {
    dropCallbackMap()
    clearMocks()
  })

  test('single callback added and called', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback('type-1', 'id-1', eventCallback)
    rootCallback(event)
    expect(eventCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledWith(event)
  })

  test('single callback added and called #2', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback('type-1', 'id-1', eventCallback)
    rootCallback(event, false)
    expect(eventCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledWith(event)
  })

  test('connection restored callback added and called', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }
    addCallback('type-1', 'id-1', eventCallback, restoreConnectionCallback)
    rootCallback(event, true)
    expect(restoreConnectionCallback).toBeCalledTimes(1)
    expect(eventCallback).toBeCalledTimes(0)
  })

  test('single callback removed', async () => {
    const event = { type: 'type-1', aggregateId: 'id-1' }

    addCallback('type-1', 'id-1', eventCallback)
    removeCallback('type-1', 'id-1', eventCallback)
    rootCallback(event)

    expect(eventCallback).toBeCalledTimes(0)
  })

  test('single callback for * added', async () => {
    const event1 = { type: 'type-1', aggregateId: 'id-1' }
    const event2 = { type: 'type-1', aggregateId: 'id-2' }
    const event3 = { type: 'type-1', aggregateId: 'id-3' }
    addCallback('type-1', '*', eventCallback)
    rootCallback(event1)
    rootCallback(event2)
    rootCallback(event3)
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
    addCallback('type-1', 'id-1', callback1)
    addCallback('type-1', 'id-1', callback2)
    addCallback('type-1', 'id-1', callback3)

    rootCallback(event)

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
    addCallback('type-1', 'id-1', callback1)
    addCallback('type-1', 'id-1', callback2)
    addCallback('type-1', 'id-1', callback3)
    removeCallback('type-1', 'id-1', callback2)
    removeCallback('type-1', 'id-1', callback3)

    rootCallback(event)

    expect(callback1).toBeCalledTimes(1)
    expect(callback1).toBeCalledWith(event)
    expect(callback2).toBeCalledTimes(0)
    expect(callback3).toBeCalledTimes(0)
  })
})
