import type {
  WrappedAdapterOperationParameters,
  AdapterOperationParameters,
  WrapOperationMethod,
  CommonAdapterPool,
  BaseAdapterPool,
  ReadModelStore,
  FunctionLike,
  StoreApi,
  UnPromise,
} from './types'

const operationImpl = async <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  operationFunc: MethodImpl,
  store: ReadModelStore<StoreApi<AdapterPool>>,
  readModelName: string,
  ...args: WrappedAdapterOperationParameters<AdapterPool, MethodImpl>
): Promise<UnPromise<ReturnType<MethodImpl>>> => {
  const adapterPool = pool.adapterPoolMap.get(store)
  if (adapterPool == null) {
    throw new pool.AlreadyDisposedError()
  }
  const result = await operationFunc(adapterPool, readModelName, ...args)
  return result
}

const wrapOperation: WrapOperationMethod = <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  operationName: string,
  operationFunc: MethodImpl
): ((
  store: ReadModelStore<StoreApi<AdapterPool>>,
  readModelName: string,
  ...args: WrappedAdapterOperationParameters<AdapterPool, MethodImpl>
) => ReturnType<MethodImpl>) =>
  pool.withPerformanceTracer(
    pool,
    operationName,
    (operationImpl.bind<
      null,
      BaseAdapterPool<AdapterPool>,
      MethodImpl,
      AdapterOperationParameters<AdapterPool, MethodImpl>,
      Promise<UnPromise<ReturnType<MethodImpl>>>
    >(null, pool, operationFunc) as unknown) as (
      store: ReadModelStore<StoreApi<AdapterPool>>,
      readModelName: string,
      ...args: WrappedAdapterOperationParameters<AdapterPool, MethodImpl>
    ) => ReturnType<MethodImpl>
  )

export default wrapOperation
