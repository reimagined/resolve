import type {
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  AdapterPoolPossiblyUnconnected,
  PoolMethod,
  Adapter,
} from './types'
import { getLog } from './get-log'
import { AlreadyDisposedError } from './errors'

const wrapDispose = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  dispose: PoolMethod<ConnectedProps, Adapter['dispose']>
) => async (): Promise<void> => {
  if (pool.disposed) {
    throw new AlreadyDisposedError()
  }
  pool.disposed = true

  const log = getLog('dispose')
  if (!pool.isConnected) {
    log.debug('event store is not yet connected, no need for disconnecting')
    return
  }

  if (pool.getConnectPromise) await pool.getConnectPromise()

  await dispose(pool as AdapterPoolConnected<ConnectedProps>)
}

export default wrapDispose
