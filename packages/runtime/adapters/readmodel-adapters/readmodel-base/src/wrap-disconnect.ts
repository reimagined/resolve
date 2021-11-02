import type {
  WrapDisconnectMethod,
  CommonAdapterPool,
  CommonAdapterOptions,
  BaseAdapterPool,
  AdapterConnection,
  ReadModelStore,
  StoreApi,
} from './types'

const disconnectImpl = async <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect'],
  store: ReadModelStore<StoreApi<AdapterPool>>
): Promise<void> => {
  const adapterPool = pool.adapterPoolMap.get(store)
  if (adapterPool == null) {
    throw new pool.AlreadyDisposedError()
  }
  pool.adapterPoolMap.delete(store)
  await disconnect(adapterPool)
}

const wrapDisconnect: WrapDisconnectMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect']
): ((store: ReadModelStore<StoreApi<AdapterPool>>) => Promise<void>) =>
  pool.withPerformanceTracer(
    pool,
    'disconnect',
    disconnectImpl.bind<
      null,
      BaseAdapterPool<AdapterPool>,
      AdapterConnection<AdapterPool, AdapterOptions>['disconnect'],
      [ReadModelStore<StoreApi<AdapterPool>>],
      Promise<void>
    >(null, pool, disconnect)
  )

export default wrapDisconnect
