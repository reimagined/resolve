import type {
  CommonAdapterPool,
  CommonAdapterOptions,
  AdapterImplementation,
  BaseAdapterImports,
  BaseAdapterPool,
  AdapterOperations,
  AdapterApi,
  ObjectKeys,
  StoreApi,
} from './types'

const createAdapter = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  imports: BaseAdapterImports,
  implementation: AdapterImplementation<AdapterPool, AdapterOptions>,
  options: AdapterOptions
): AdapterApi<AdapterPool> => {
  const {
    splitNestedPath,
    checkEventsContinuity,
    withPerformanceTracer,
    wrapWithCloneArgs,
    wrapConnect,
    wrapDisconnect,
    wrapDispose,
    wrapOperation,
  } = imports

  const {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    resubscribe,
    resume,
    pause,
    reset,
    status,
    build,
    defineTable,
    findOne,
    find,
    count,
    insert,
    update,
    delete: del,
    ...restApi
  } = implementation

  if (Object.keys(restApi).length > 0) {
    throw new Error(
      `Read model adapter implementation should not provide extra methods: ${JSON.stringify(
        Object.keys(restApi)
      )}`
    )
  }

  const storeApi: StoreApi<AdapterPool> = {
    defineTable,
    findOne,
    find,
    count,
    insert,
    update,
    delete: del,
  }

  const adapterOperations: AdapterOperations<AdapterPool> = {
    subscribe,
    unsubscribe,
    resubscribe,
    resume,
    pause,
    reset,
    status,
    build,
  }

  for (const key of Object.keys(storeApi) as ObjectKeys<
    StoreApi<AdapterPool>
  >) {
    if (typeof storeApi[key] !== 'function') {
      throw new Error(`Store API method ${key} should be a function`)
    }
  }

  for (const key of Object.keys(adapterOperations) as ObjectKeys<
    AdapterOperations<AdapterPool>
  >) {
    if (typeof adapterOperations[key] !== 'function') {
      throw new Error(`Adapter operation method ${key} should be a function`)
    }
  }

  const { performanceTracer, monitoring, ...adapterOptions } = options

  const pool: BaseAdapterPool<AdapterPool> = {
    commonAdapterPool: {
      performanceTracer,
      checkEventsContinuity,
      splitNestedPath,
      monitoring,
    },
    adapterPoolMap: new Map(),
    withPerformanceTracer,
    performanceTracer,
    monitoring,
  }

  const adapter: AdapterApi<AdapterPool> = {
    connect: wrapConnect(
      pool,
      wrapWithCloneArgs,
      connect,
      storeApi,
      adapterOptions
    ),
    disconnect: wrapDisconnect(pool, disconnect),
    dispose: wrapDispose(pool, disconnect),
    subscribe: wrapOperation(pool, 'subscribe', subscribe),
    unsubscribe: wrapOperation(pool, 'unsubscribe', unsubscribe),
    resubscribe: wrapOperation(pool, 'resubscribe', resubscribe),
    resume: wrapOperation(pool, 'resume', resume),
    pause: wrapOperation(pool, 'pause', pause),
    reset: wrapOperation(pool, 'reset', reset),
    status: wrapOperation(pool, 'status', status),
    build: wrapOperation(pool, 'build', build),
  }

  return Object.freeze(adapter)
}

export default createAdapter
