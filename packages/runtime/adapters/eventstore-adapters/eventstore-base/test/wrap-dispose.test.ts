import wrapDispose from '../src/wrap-dispose'
import type { AdapterBoundPool } from '../src'

test('wrap dispose should bypass on correct arguments', async () => {
  const rawDispose = jest.fn(async () => {
    void 0
  })
  const pool = {
    disposed: false,
  } as AdapterBoundPool<{}>

  const dispose = wrapDispose(pool, rawDispose)
  await dispose()

  expect(rawDispose).toHaveBeenCalledTimes(1)

  expect(pool.disposed).toEqual(true)
})
