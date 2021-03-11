import type {
  WrapConnectMethod,
  CommonAdapterPool,
  CommonAdapterOptions,
  BaseAdapterPool,
  AdapterConnection,
  ReadModelStore,
  StoreApi,
  OmitObject,
} from './types'

const connectImpl = async <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
>(
  pool: BaseAdapterPool<AdapterPool>,
  connect: AdapterConnection<AdapterPool, AdapterOptions>['connect'],
  storeApi: StoreApi<AdapterPool>,
  options: AdapterOptions,
  readModelName: string
): Promise<ReadModelStore<StoreApi<AdapterPool>>> => {
  const adapterPool = { ...pool.commonAdapterPool } as AdapterPool
  await connect(adapterPool, options)

  const {
    defineTable,
    findOne,
    find,
    count,
    insert,
    update,
    delete: del,
  } = storeApi
  const store: ReadModelStore<StoreApi<AdapterPool>> = {
    defineTable: defineTable.bind(null, adapterPool, readModelName),
    findOne: findOne.bind(null, adapterPool, readModelName),
    find: find.bind(null, adapterPool, readModelName),
    count: count.bind(null, adapterPool, readModelName),
    insert: insert.bind(null, adapterPool, readModelName),
    update: update.bind(null, adapterPool, readModelName),
    delete: del.bind(null, adapterPool, readModelName),
    performanceTracer: pool.performanceTracer,
  }

  Object.freeze(store)
  pool.adapterPoolMap.set(store, adapterPool)

  return store
}

const wrapConnect: WrapConnectMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
>(
  pool: BaseAdapterPool<AdapterPool>,
  connect: AdapterConnection<AdapterPool, AdapterOptions>['connect'],
  storeApi: StoreApi<AdapterPool>,
  options: AdapterOptions
): ((
  readModelName: string
) => Promise<ReadModelStore<StoreApi<AdapterPool>>>) =>
  pool.withPerformanceTracer(
    pool,
    'connect',
    connectImpl.bind<
      null,
      BaseAdapterPool<AdapterPool>,
      AdapterConnection<AdapterPool, AdapterOptions>['connect'],
      StoreApi<AdapterPool>,
      AdapterOptions,
      [string],
      Promise<ReadModelStore<StoreApi<AdapterPool>>>
    >(null, pool, connect, storeApi, options)
  )

export default wrapConnect
