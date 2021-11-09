import type {
  AdapterPrimalPool,
  AdapterBoundPool,
  PoolMethod,
  Adapter,
} from './types'
import { AlreadyDisposedError } from './errors'

const wrapDispose = <ConfiguredProps extends {}>(
  pool: AdapterPrimalPool<ConfiguredProps>,
  dispose: PoolMethod<ConfiguredProps, Adapter['dispose']>
) => async (): Promise<void> => {
  if (pool.disposed) {
    throw new AlreadyDisposedError()
  }
  pool.disposed = true
  await dispose(pool as AdapterBoundPool<ConfiguredProps>)
}

export default wrapDispose
