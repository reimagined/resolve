import {
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  PoolMethod,
  Adapter,
} from './types'

const wrapDispose = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  dispose: PoolMethod<ConnectedProps, Adapter['dispose']>
) => async (): Promise<void> => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  pool.disposed = true
  if (!pool.isInitialized) {
    return
  }

  if (pool.getConnectPromise) await pool.getConnectPromise()

  await dispose(pool as AdapterPoolConnected<ConnectedProps>)
}

export default wrapDispose
