import type {
  WrapDisposeMethod,
  CommonAdapterPool,
  CommonAdapterOptions,
  BaseAdapterPool,
  AdapterConnection,
} from './types'

const disposeImpl = async <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect']
): Promise<void> => {
  const adapterPools = [...pool.adapterPoolMap.values()]
  pool.adapterPoolMap.clear()
  for (const adapterPool of adapterPools) {
    await disconnect(adapterPool)
  }
}

const wrapDispose: WrapDisposeMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect']
): (() => Promise<void>) =>
  pool.withPerformanceTracer(
    pool,
    'dispose',
    disposeImpl.bind<
      null,
      BaseAdapterPool<AdapterPool>,
      AdapterConnection<AdapterPool, AdapterOptions>['disconnect'],
      [],
      Promise<void>
    >(null, pool, disconnect)
  )

export default wrapDispose
