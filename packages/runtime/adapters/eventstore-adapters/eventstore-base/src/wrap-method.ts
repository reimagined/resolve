import type {
  PromiseResultType,
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  RemoveFirstType,
} from './types'

const connectOnDemandAndCall = async <
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (pool: AdapterPoolConnected<ConnectedProps>, ...args: any[]) => any
>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  method: M,
  ...args: RemoveFirstType<Parameters<M>>
): Promise<PromiseResultType<ReturnType<M>>> => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  pool.isConnected = true
  const connectPromise = pool.getConnectPromise()
  await connectPromise

  return await method(pool as AdapterPoolConnected<ConnectedProps>, ...args)
}

function generateAssertTrap<F extends (...args: any[]) => any>() {
  return (...args: Parameters<F>): ReturnType<F> => {
    throw new Error('Adapter method is not implemented')
  }
}

const wrapMethod = <
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (pool: AdapterPoolConnected<ConnectedProps>, ...args: any[]) => any
>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  method: M | undefined
) => {
  if (method === undefined)
    return generateAssertTrap<
      (
        ...args: RemoveFirstType<Parameters<M>>
      ) => Promise<PromiseResultType<ReturnType<M>>>
    >()
  else
    return async (
      ...args: RemoveFirstType<Parameters<M>>
    ): Promise<PromiseResultType<ReturnType<M>>> => {
      return await connectOnDemandAndCall(pool, method, ...args)
    }
}

export default wrapMethod
