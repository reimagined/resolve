import type {
  WrapIsConditionUnsupportedFormatMethod,
  WrapConnectMethod,
  CommonAdapterPool,
  CommonAdapterOptions,
  WrapWithCloneArgsMethod,
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
  {
    pool,
    wrapIsConditionUnsupportedFormat,
    wrapWithCloneArgs,
  }: {
    pool: BaseAdapterPool<AdapterPool>
    wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod
    wrapWithCloneArgs: WrapWithCloneArgsMethod
  },
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
    defineTable: wrapWithCloneArgs(
      defineTable.bind(null, adapterPool, readModelName)
    ),
    findOne: wrapIsConditionUnsupportedFormat(
      wrapWithCloneArgs(findOne.bind(null, adapterPool, readModelName))
    ),
    find: wrapIsConditionUnsupportedFormat(
      wrapWithCloneArgs(find.bind(null, adapterPool, readModelName))
    ),
    count: wrapIsConditionUnsupportedFormat(
      wrapWithCloneArgs(count.bind(null, adapterPool, readModelName))
    ),
    insert: wrapWithCloneArgs(insert.bind(null, adapterPool, readModelName)),
    update: wrapIsConditionUnsupportedFormat(
      wrapWithCloneArgs(update.bind(null, adapterPool, readModelName))
    ),
    delete: wrapIsConditionUnsupportedFormat(
      wrapWithCloneArgs(del.bind(null, adapterPool, readModelName))
    ),
    performanceTracer: pool.performanceTracer,
    monitoring: pool.monitoring,
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
  wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod,
  wrapWithCloneArgs: WrapWithCloneArgsMethod,
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
      {
        pool: BaseAdapterPool<AdapterPool>
        wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod
        wrapWithCloneArgs: WrapWithCloneArgsMethod
      },
      AdapterConnection<AdapterPool, AdapterOptions>['connect'],
      StoreApi<AdapterPool>,
      AdapterOptions,
      [string],
      Promise<ReadModelStore<StoreApi<AdapterPool>>>
    >(
      null,
      { pool, wrapIsConditionUnsupportedFormat, wrapWithCloneArgs },
      connect,
      storeApi,
      options
    )
  )

export default wrapConnect
