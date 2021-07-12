import {
  PromiseResultType,
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
} from './types'

const connectOnDemandAndCall = async <
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (pool: AdapterPoolConnected<ConnectedProps>, ...args: any[]) => any
>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  method: M,
  ...args: Parameters<M>
): Promise<PromiseResultType<ReturnType<M>>> => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  pool.isInitialized = true
  if (pool.getConnectPromise) {
    const connectPromise = pool.getConnectPromise()
    await connectPromise
  }

  return await method(pool as AdapterPoolConnected<ConnectedProps>, ...args)
}

const wrapMethod = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  method?: any
): any =>
  typeof method !== 'undefined'
    ? connectOnDemandAndCall.bind(null, pool, method)
    : undefined

export default wrapMethod
