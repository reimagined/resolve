import {
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  Dispose,
} from './types'

const wrapDispose = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  dispose: Dispose<ConnectedProps>
) => async (): Promise<void> => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  pool.disposed = true
  if (!pool.isInitialized) {
    return
  }

  await pool.connectPromise

  await dispose(pool as AdapterPoolConnected<ConnectedProps>)
}

export default wrapDispose
