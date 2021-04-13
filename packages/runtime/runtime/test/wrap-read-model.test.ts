import { customReadModelMethods } from '../src/common/query/wrap-read-model'
import { ReadModelPool } from '../src/common/query/types'

test('resume should call next if read-model status is successful', async () => {
  let ensured = false
  const mockCallback = jest.fn(() => ensured)
  const pool = ({
    invokeEventSubscriberAsync: mockCallback,
    eventstoreAdapter: {
      getEventSubscribers: async (options: any) => {
        return [{ status: { status: 'deliver' } }]
      },
      ensureEventSubscriber: async (...args: any) => {
        ensured = true
      },
    },
  } as unknown) as ReadModelPool

  await customReadModelMethods.resume(pool, {} as any, {}, '', {})

  expect(mockCallback.mock.results[0].value).toBe(true)
})

test('subscribe should set status.name=<read-model-name>', async () => {
  const interop: any = 'interop'
  const connection: any = 'connection'
  const readModelName: any = 'readModelName'
  const parameters = {
    subscriptionOptions: {
      eventTypes: [],
      aggregateIds: [],
    },
  }
  const pool = ({
    eventstoreAdapter: {
      getEventSubscribers: () => [
        {
          status: {
            eventSubscriber: readModelName,
            status: 'deliver',
          },
        },
      ],
      ensureEventSubscriber: jest.fn(),
    },
  } as unknown) as ReadModelPool

  await customReadModelMethods.subscribe(
    pool,
    interop,
    connection,
    readModelName,
    parameters
  )

  expect(pool.eventstoreAdapter.ensureEventSubscriber).toBeCalledWith({
    eventSubscriber: 'readModelName',
    status: {
      aggregateIds: [],
      busy: false,
      eventSubscriber: 'readModelName',
      eventTypes: [],
      status: 'deliver',
    },
    updateOnly: true,
  })
})

test('resubscribe should set status.name=<read-model-name>', async () => {
  const pool = ({
    eventstoreAdapter: {
      ensureEventSubscriber: jest.fn(),
    },
    connector: {
      drop: jest.fn(),
    },
  } as unknown) as ReadModelPool

  const interop: any = 'interop'
  const connection: any = 'connection'
  const readModelName: any = 'readModelName'
  const parameters = {
    subscriptionOptions: {
      eventTypes: [],
      aggregateIds: [],
    },
  }

  await customReadModelMethods.resubscribe(
    pool,
    interop,
    connection,
    readModelName,
    parameters
  )

  expect(pool.eventstoreAdapter.ensureEventSubscriber).toBeCalledWith({
    eventSubscriber: 'readModelName',
    status: {
      aggregateIds: [],
      busy: false,
      eventSubscriber: 'readModelName',
      eventTypes: [],
      status: 'skip',
    },
    updateOnly: true,
  })
})
