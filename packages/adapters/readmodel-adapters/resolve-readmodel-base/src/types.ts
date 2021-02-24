export type JsonPrimitive = string | number | boolean | null
export type JsonMap = {
  [member: string]: JsonPrimitive | JsonArray | JsonMap
}
export type JsonArray = Array<JsonPrimitive | JsonArray | JsonMap>
export type JsonResult = {
  [member: string]: any
}
export type SearchCondition =
  | {
      $and: Array<SearchCondition>
    }
  | {
      $or: Array<SearchCondition>
    }
  | {
      $not: SearchCondition
    }
  | {
      [member: string]: JsonPrimitive
    }
  | {
      [member: string]: {
        $eq: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $ne: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $lte: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $gte: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $lt: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $gt: JsonPrimitive
      }
    }

export type UpdateCondition =
  | {
      $set: {
        [member: string]: JsonMap | JsonArray | JsonPrimitive
      }
    }
  | {
      $unset: {
        [member: string]: true
      }
    }
  | {
      $inc: {
        [member: string]: number | string
      }
    }

export type ResolveStore = {
  defineTable: (
    tableName: string,
    tableDeclaration: {
      indexes: {
        [member: string]: 'string' | 'number'
      }
      fields: Array<string>
    }
  ) => Promise<void>
  find: (
    tableName: string,
    searchCondition: SearchCondition,
    projectionCondition?: {
      [member: string]: 1 | 0
    },
    sortCondition?: {
      [member: string]: 1 | -1
    },
    skip?: number,
    limit?: number
  ) => Promise<Array<JsonResult>>
  findOne: (
    tableName: string,
    searchCondition: SearchCondition,
    projectionCondition?: {
      [member: string]: 1 | 0
    }
  ) => Promise<JsonResult | null>
  count: (
    tableName: string,
    searchCondition: SearchCondition
  ) => Promise<number>
  insert: (tableName: string, document: JsonMap) => Promise<void>
  update: (
    tableName: string,
    searchCondition: SearchCondition,
    updateCondition: UpdateCondition,
    updateOptions?: {
      upsert?: boolean
    }
  ) => Promise<void>
  delete: (tableName: string, searchCondition: SearchCondition) => Promise<void>
}

export type EncryptionLike = {
  encrypt<Input, Output>(input: Input): Output
  decrypt<Input, Output>(input: Input): Output
}

export type PerformanceTracerLike = {
  getSegment(): {
    addNewSubsegment(
      arg0: string
    ): {
      addAnnotation(arg0: string, arg1: string): void
      addError(error: Error): void
      close(): void
    } | null
  } | null
}

export type ReadModelCursor = string | null // TODO brand type
export type ReadModelEvent = {
  aggregateId: string
  aggregateVersion: number
  timestamp: number
  type: string
  payload: JsonMap | JsonArray | JsonPrimitive
}

export type EventstoreAdapterLike = {
  loadEvents(filter: {
    eventTypes: Array<ReadModelEvent['type']> | null
    eventsSizeLimit: number | null
    limit: number | null
    cursor: ReadModelCursor | null
  }): Promise<{
    events: Array<ReadModelEvent>
    cursor: ReadModelCursor
  }>
  getNextCursor(
    previousCursor: ReadModelCursor,
    appliedEvents: Array<ReadModelEvent>
  ): ReadModelCursor
}

export type CommonAdapterPool = {
  performanceTracer?: PerformanceTracerLike
}

export type CommonAdapterOptions = {
  performanceTracer?: PerformanceTracerLike
}

export type ResolveStoreToStoreApi<
  AdapterPool extends CommonAdapterPool,
  Method
> = Method extends (...args: infer Args) => infer Result
  ? (adapterPool: AdapterPool, readModelName: string, ...args: Args) => Result
  : never

export type StoreApi<AdapterPool extends CommonAdapterPool> = {
  [K in keyof ResolveStore]: ResolveStoreToStoreApi<
    AdapterPool,
    ResolveStore[K]
  >
}

export type StoreApiToReadModelStore<
  AdapterPool extends CommonAdapterPool,
  StoreMethodType
> = StoreMethodType extends (
  adapterPool: AdapterPool,
  readModelName: string,
  ...args: infer Args
) => infer Result
  ? (...args: Args) => Result
  : never

export type ReadModelStoreImpl<
  AdapterPool extends CommonAdapterPool,
  CurrentStoreApi
> = {
  [K in keyof CurrentStoreApi]: StoreApiToReadModelStore<
    AdapterPool,
    CurrentStoreApi[K]
  >
} & {
  performanceTracer?: PerformanceTracerLike
}

export type FunctionLike = (...args: any[]) => any
export type NewableLike = new (...args: any[]) => any

export type ReadModelStore<CurrentStoreApi> = CurrentStoreApi extends StoreApi<
  infer AdapterPool
>
  ? ReadModelStoreImpl<AdapterPool, CurrentStoreApi>
  : never

export type WithPerformanceTracerMethod = <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  methodName: string,
  methodImpl: MethodImpl
) => MethodImpl

export type ReadModelLedger = {
  EventTypes: Array<ReadModelEvent['type']> | null
  AggregateIds: Array<ReadModelEvent['aggregateId']> | null
  Cursor: ReadModelCursor
  SuccessEvent: ReadModelEvent | null
  FailedEvent: ReadModelEvent | null
  Errors: Array<Error> | null
  Properties: Record<string, string> | null
  Schema: Record<string, string> | null
  IsPaused: boolean
}

export type MethodNext = () => Promise<void>
export type MethodGetRemainingTime = () => number
export type MethodProvideLedger = (ledger: ReadModelLedger) => Promise<void>
export type MethodGetEncryption = () => (
  event: ReadModelEvent
) => EncryptionLike

export enum ReadModelRunStatus {
  DELIVER = 'deliver',
  SKIP = 'skip',
  ERROR = 'error',
}

export type ReadModelStatus = {
  eventSubscriber: string
  properties: Record<string, string> | null
  deliveryStrategy: 'inline-ledger'
  successEvent: ReadModelEvent | null
  failedEvent: ReadModelEvent | null
  errors: Array<Error> | null
  cursor: ReadModelCursor
  status: ReadModelRunStatus
}

export type ProjectionMethod<AdapterPool extends CommonAdapterPool> = (
  projectionStore: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
  projectionEvent: ReadModelEvent,
  projectionEncryption?: EncryptionLike
) => Promise<void>

export type OmitObject<T extends object, U extends object> = {
  [K in Exclude<keyof T, keyof U>]: T[K]
}

export type AdapterConnection<
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
> = {
  connect(pool: AdapterPool, options: AdapterOptions): Promise<void>

  disconnect(pool: AdapterPool): Promise<void>
}

export type AdapterOperations<AdapterPool extends CommonAdapterPool> = {
  subscribe(
    pool: AdapterPool,
    readModelName: string,
    eventTypes: Array<ReadModelEvent['type']> | null,
    aggregateIds: Array<ReadModelEvent['aggregateId']> | null
  ): Promise<void>

  unsubscribe(pool: AdapterPool, readModelName: string): Promise<void>

  resubscribe(
    pool: AdapterPool,
    readModelName: string,
    eventTypes: Array<ReadModelEvent['type']> | null,
    aggregateIds: Array<ReadModelEvent['aggregateId']> | null
  ): Promise<void>

  deleteProperty(
    pool: AdapterPool,
    readModelName: string,
    key: string
  ): Promise<void>

  getProperty(
    pool: AdapterPool,
    readModelName: string,
    key: string
  ): Promise<string | null>

  listProperties(
    pool: AdapterPool,
    readModelName: string
  ): Promise<Record<string, string> | null>

  setProperty(
    pool: AdapterPool,
    readModelName: string,
    key: string,
    value: string
  ): Promise<void>

  resume(
    pool: AdapterPool,
    readModelName: string,
    next: MethodNext
  ): Promise<void>

  pause(pool: AdapterPool, readModelName: string): Promise<void>

  reset(pool: AdapterPool, readModelName: string): Promise<void>

  status(
    pool: AdapterPool,
    readModelName: string
  ): Promise<ReadModelStatus | null>

  build(
    pool: AdapterPool,
    readModelName: string,
    store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
    modelInterop: {
      acquireInitHandler: (
        store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>
      ) => () => Promise<void>
      acquireEventHandler: (
        store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
        event: ReadModelEvent
      ) => () => Promise<void>
    },
    next: MethodNext,
    eventstoreAdapter: EventstoreAdapterLike,
    getVacantTimeInMillis: MethodGetRemainingTime,
    provideLedger: MethodProvideLedger
  ): Promise<void>
}

export type AdapterImplementation<
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
> = AdapterConnection<
  AdapterPool,
  OmitObject<AdapterOptions, CommonAdapterOptions>
> &
  AdapterOperations<AdapterPool> &
  StoreApi<AdapterPool>

export type BaseAdapterPool<AdapterPool extends CommonAdapterPool> = {
  commonAdapterPool: CommonAdapterPool
  adapterPoolMap: Map<ReadModelStore<StoreApi<AdapterPool>>, AdapterPool>
  withPerformanceTracer: WithPerformanceTracerMethod
  performanceTracer?: PerformanceTracerLike
}

export type UnPromise<T> = T extends Promise<infer R> ? R : T

export type ConnectMethod<AdapterPool extends CommonAdapterPool> = (
  readModelName: string
) => Promise<ReadModelStore<StoreApi<AdapterPool>>>

export type WrapConnectMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
>(
  pool: BaseAdapterPool<AdapterPool>,
  connect: AdapterConnection<AdapterPool, AdapterOptions>['connect'],
  storeApi: StoreApi<AdapterPool>,
  options: AdapterOptions
) => ConnectMethod<AdapterPool>

export type DisconnectMethod<AdapterPool extends CommonAdapterPool> = (
  store: ReadModelStore<StoreApi<AdapterPool>>
) => Promise<void>

export type WrapDisconnectMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect']
) => DisconnectMethod<AdapterPool>

export type DisposeMethod = () => Promise<void>

export type WrapDisposeMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  pool: BaseAdapterPool<AdapterPool>,
  disconnect: AdapterConnection<AdapterPool, AdapterOptions>['disconnect']
) => DisposeMethod

export type WrappedAdapterOperationParameters<
  AdapterPool extends CommonAdapterPool,
  Method extends FunctionLike
> = Method extends (
  pool: AdapterPool,
  readModelName: string,
  ...args: infer Args
) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
infer Result
  ? Args
  : never

export type WrapOperationMethod = <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  operationName: string,
  operationFunc: MethodImpl
) => (
  store: ReadModelStore<StoreApi<AdapterPool>>,
  readModelName: string,
  ...args: WrappedAdapterOperationParameters<AdapterPool, MethodImpl>
) => ReturnType<MethodImpl>

export type BaseAdapterImports = {
  withPerformanceTracer: WithPerformanceTracerMethod
  wrapConnect: WrapConnectMethod
  wrapDisconnect: WrapDisconnectMethod
  wrapDispose: WrapDisposeMethod
  wrapOperation: WrapOperationMethod
}

export type AdapterOperationsToAdapterApi<
  AdapterPool extends CommonAdapterPool,
  AdapterOperationMethodType
> = AdapterOperationMethodType extends (
  adapterPool: AdapterPool,
  readModelName: string,
  ...args: infer Args
) => infer Result
  ? (
      store: ReadModelStore<StoreApi<AdapterPool>>,
      readModelName: string,
      ...args: Args
    ) => Result
  : never

export type AdapterApi<AdapterPool extends CommonAdapterPool> = {
  [K in keyof AdapterOperations<AdapterPool>]: AdapterOperationsToAdapterApi<
    AdapterPool,
    AdapterOperations<AdapterPool>[K]
  >
} & {
  connect: ConnectMethod<AdapterPool>
  disconnect: DisconnectMethod<AdapterPool>
  dispose: DisposeMethod
}

export type AdapterOperationParameters<
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
> = Parameters<
  (
    store: ReadModelStore<StoreApi<AdapterPool>>,
    readModelName: string,
    ...args: WrappedAdapterOperationParameters<AdapterPool, MethodImpl>
  ) => void
>

export type CreateAdapterMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends CommonAdapterOptions
>(
  implementation: AdapterImplementation<AdapterPool, AdapterOptions>,
  options: AdapterOptions
) => AdapterApi<AdapterPool>

export type ObjectKeys<T> = T extends object
  ? (keyof T)[]
  : T extends number
  ? []
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends Array<infer R> | string
  ? string[]
  : never

export type ObjectFixedKeys<T extends object> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U }
  ? U
  : never

export type DistributeKeysUnion<U> = U extends string | number | symbol
  ? { [K in U]: any }
  : never

export type ObjectDictionaryKeys<T extends object> = Exclude<
  T,
  DistributeKeysUnion<ObjectFixedKeys<T>>
>

export type DistributeFixedFieldsUnionLikeObject<
  U extends object,
  K extends keyof any,
  KS extends keyof U = Exclude<ObjectFixedKeys<U>, K>
> = KS extends any ? { [K in KS]: any } : never

export type ExtractExactUnionLikeKeyType<
  U extends object,
  K extends keyof any,
  Q extends object = Exclude<U, DistributeFixedFieldsUnionLikeObject<U, K>>
> = Extract<Q, { [K in ObjectFixedKeys<Q>]: Q[K] }>[keyof Extract<
  Q,
  { [K in ObjectFixedKeys<Q>]: Q[K] }
>]

export type DistributeUnionLikeObject<
  U extends object,
  KS extends keyof U = ObjectFixedKeys<U>
> = KS extends any ? ExtractExactUnionLikeKeyType<U, KS> : never

export type ObjectFixedUnionToIntersection<U extends object> = {
  [K in ObjectFixedKeys<U>]: DistributeUnionLikeObject<U>
}

export type ObjectFixedUnionToIntersectionByKeys<
  U extends object,
  KS extends keyof any
> = {
  [K in Extract<KS, ObjectFixedKeys<U>>]: DistributeUnionLikeObject<
    U,
    Extract<KS, ObjectFixedKeys<U>>
  >
}

export type ObjectFixedIntersectionToObject<T extends object> = {
  [K in ObjectFixedKeys<T>]: ExtractExactUnionLikeKeyType<T, K>
}

export type ObjectFunctionLikeKeys<
  U extends object,
  KS extends keyof U = ObjectFixedKeys<U>
> = KS extends any ? (U[KS] extends FunctionLike ? KS : never) : never

export type JsonLike = JsonPrimitive | JsonArray | JsonMap

export type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N

export type IsTypeLike<T, B> = IfEquals<Extract<T, B>, T>

export type ExtractNewable<F extends NewableLike> = F extends new (
  ...args: infer Args
) => infer Result
  ? new (...args: Args) => Result
  : never

export type ExtractFunction<F extends FunctionLike> = F extends (
  ...args: infer Args
) => infer Result
  ? (...args: Args) => Result
  : never

export type MakeNewableFunction<F extends FunctionLike> = F extends (
  this: infer T,
  ...args: infer Args
) => infer Result
  ? T extends object
    ? IfEquals<
        Result,
        T,
        new (...args: Args) => T,
        IfEquals<
          Result,
          null,
          new (...args: Args) => T,
          IfEquals<
            Result,
            undefined,
            new (...args: Args) => T,
            IfEquals<
              Result,
              boolean,
              new (...args: Args) => T,
              IfEquals<
                Result,
                string,
                new (...args: Args) => T,
                IfEquals<
                  Result,
                  number,
                  new (...args: Args) => T,
                  IfEquals<Result, void, new (...args: Args) => T, never>
                >
              >
            >
          >
        >
      >
    : never
  : never
