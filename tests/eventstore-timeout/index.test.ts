import {
  adapterFactory,
  adapters,
  jestTimeout,
  isPostgres,
  makeTestEvent,
} from '../eventstore-test-utils'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'

jest.setTimeout(jestTimeout())

const maybeRunTest = isPostgres() ? describe : describe.skip

maybeRunTest(`${adapterFactory.name}. Eventstore adapter errors`, () => {
  let start = Date.now()
  beforeAll(adapterFactory.create('timeout_testing'))
  afterAll(adapterFactory.destroy('timeout_testing'))

  const adapter = adapters['timeout_testing']

  test('saveEvent should throw RequestTimeoutError after the configured amount of time', async () => {
    adapter.establishTimeLimit(() => start + 2500 - Date.now())

    start = Date.now()
    await adapter.loadEvents({ limit: 1, cursor: null }) // make sure the adapter is connected

    start = Date.now()
    await new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })
    await expect(adapter.saveEvent(makeTestEvent(0))).rejects.toThrow(
      RequestTimeoutError
    )
  })

  test('establishTimeLimit should change the timeout and that should be enough to save the event', async () => {
    adapter.establishTimeLimit(() => start + 5000 - Date.now())
    start = Date.now()
    await new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })
    await expect(adapter.saveEvent(makeTestEvent(0))).resolves.not.toThrow()

    await new Promise((resolve) => {
      setTimeout(resolve, 2500)
    })
    await expect(adapter.saveEvent(makeTestEvent(1))).rejects.toThrow(
      RequestTimeoutError
    )
    start = Date.now()
  })

  test('at some point of time saveEvent should start throwing timeout errors', async () => {
    adapter.establishTimeLimit(() => start + 1500 - Date.now())
    start = Date.now()

    let thrown = false
    let i = 1
    for (; i < 1500; ++i) {
      try {
        await adapter.saveEvent(makeTestEvent(i))
      } catch (err) {
        if (RequestTimeoutError.is(err)) {
          thrown = true
          break
        }
      }
    }
    expect(i).toBeGreaterThan(1)
    expect(thrown).toBe(true)
    start = Date.now()
  })
})
