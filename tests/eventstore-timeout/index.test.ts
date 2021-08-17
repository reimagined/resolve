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
  beforeAll(
    adapterFactory.create('timeout_testing', {
      getVacantTimeInMillis: () => start + 3000 - Date.now(),
    })
  )
  afterAll(adapterFactory.destroy('timeout_testing'))

  const adapter = adapters['timeout_testing']

  test('saveEvent should throw RequestTimeoutError after the configured amount of time', async () => {
    start = Date.now()
    await adapter.loadEvents({ limit: 1, cursor: null }) // make sure the adapter is connected

    start = Date.now()
    await new Promise((resolve) => {
      setTimeout(resolve, 3500)
    })
    await expect(adapter.saveEvent(makeTestEvent(0))).rejects.toThrow(
      RequestTimeoutError
    )
  })

  test('establishTimeLimit should change the timeout and that should be enough to save the event', async () => {
    adapter.establishTimeLimit(() => start + 6000 - Date.now())
    start = Date.now()
    await new Promise((resolve) => {
      setTimeout(resolve, 3500)
    })
    await expect(adapter.saveEvent(makeTestEvent(0))).resolves.not.toThrow()
  })
})
