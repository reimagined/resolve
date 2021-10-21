import { AlreadyDisposedError } from '../src'
import bindMethod from '../src/bind-method'
import type {
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
} from '../src'
import type { AdapterPoolPrimalProps } from '../src/types'

test('wrapMethod should wrap API methods to await connection', async () => {
  const apiMethod = jest.fn()

  const pool = {
    isConnected: false,
    createGetConnectPromise: jest.fn() as AdapterPoolPrimalProps['createGetConnectPromise'],
    getConnectPromise: jest.fn() as AdapterPoolPrimalProps['getConnectPromise'],
  } as AdapterPoolPossiblyUnconnected<AdapterPoolConnectedProps>

  const wrappedApiMethod = bindMethod(pool, apiMethod)

  expect(apiMethod).toHaveBeenCalledTimes(0)

  const methodArg = {}
  await wrappedApiMethod(methodArg)

  expect(apiMethod).toHaveBeenCalledTimes(1)

  expect(apiMethod).toHaveBeenCalledWith(pool, methodArg)

  expect(pool.getConnectPromise).toHaveBeenCalled()
  expect(pool.isConnected).toBe(true)
})

test('wrapMethod handle dispose adapter state', async () => {
  const apiMethod = jest.fn()

  const pool = {
    disposed: true,
  } as AdapterPoolPossiblyUnconnected<AdapterPoolConnectedProps>

  const wrappedApiMethod = bindMethod(pool, apiMethod)
  expect(apiMethod).toHaveBeenCalledTimes(0)

  await expect(wrappedApiMethod()).rejects.toThrow(AlreadyDisposedError)
})
