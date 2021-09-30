import wrapDispose from '../src/wrap-dispose'
import type { AdapterPoolConnected, AdapterPoolConnectedProps } from '../src'

test('wrap dispose should bypass on correct arguments', async () => {
  const rawDispose = jest.fn(async () => {
    void 0
  })
  const pool = {
    isConnected: true,
  } as AdapterPoolConnected<AdapterPoolConnectedProps>

  const dispose = wrapDispose(pool, rawDispose)
  await dispose()

  expect(rawDispose).toHaveBeenCalledTimes(1)

  expect(pool.disposed).toEqual(true)
})
