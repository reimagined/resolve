import { AlreadyDisposedError } from '../src'
import bindMethod from '../src/bind-method'
import type { AdapterBoundPool } from '../src'

test('bindMethod handle dispose adapter state', async () => {
  const apiMethod = jest.fn()

  const pool = {
    disposed: true,
  } as AdapterBoundPool<{}>

  const wrappedApiMethod = bindMethod(pool, apiMethod)
  expect(apiMethod).toHaveBeenCalledTimes(0)

  expect(() => wrappedApiMethod()).toThrow(AlreadyDisposedError)
})
