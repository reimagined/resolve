import type {
  WrapConnectMethod,
  CommonAdapterPool,
  CommonAdapterOptions,
  BaseAdapterPool,
  AdapterConnection,
  ReadModelStore,
  StoreApi,
  OmitObject,
  FunctionLike,
  JsonLike,
} from './types'

const deepClone = <T extends JsonLike | undefined>(value: T): T =>
  ((value !== undefined
    ? JSON.parse(JSON.stringify(value))
    : undefined) as unknown) as T

const wrapWithCloneArgs = <T extends FunctionLike>(fn: T): T =>
  (((...args: Parameters<T>): ReturnType<T> =>
    fn(...args.map((arg) => deepClone(arg)))) as unknown) as T

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
    defineTable: wrapWithCloneArgs(
      defineTable.bind(null, adapterPool, readModelName)
    ),
    findOne: wrapWithCloneArgs(findOne.bind(null, adapterPool, readModelName)),
    find: wrapWithCloneArgs(find.bind(null, adapterPool, readModelName)),
    count: wrapWithCloneArgs(count.bind(null, adapterPool, readModelName)),
    insert: wrapWithCloneArgs(insert.bind(null, adapterPool, readModelName)),
    update: wrapWithCloneArgs(update.bind(null, adapterPool, readModelName)),
    delete: wrapWithCloneArgs(del.bind(null, adapterPool, readModelName)),
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
