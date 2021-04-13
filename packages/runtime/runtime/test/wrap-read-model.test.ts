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
