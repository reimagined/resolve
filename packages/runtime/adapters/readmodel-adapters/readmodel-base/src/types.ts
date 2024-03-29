import type {
  Adapter as EventStoreAdapter,
  InputCursor,
  StoredEvent,
  StoredEventPointer as EventStoreEventWithCursor,
  checkEventsContinuity,
  EventThreadData as EventStoreEventThreadData,
} from '@resolve-js/eventstore-base'

import type {
  PerformanceTracer,
  Monitoring,
  ReadModelInterop,
} from '@resolve-js/core'

export type CheckEventsContinuityMethod = typeof checkEventsContinuity
export type EventWithCursor = EventStoreEventWithCursor
export type EventThreadData = EventStoreEventThreadData

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

export type PerformanceTracerLike = PerformanceTracer

export type MonitoringLike = Monitoring

export type ReadModelCursor = InputCursor // TODO brand type
export type ReadModelEvent = StoredEvent

export type EventStoreAdapterLike = EventStoreAdapter

export type SplitNestedPathMethod = (input: string) => Array<string>

export type EventStoreAdapterKeys = keyof EventStoreAdapter
export type EventStoreAdapterIsAsyncFunctionalKey<
  T extends EventStoreAdapterKeys
> = EventStoreAdapter[T] extends FunctionLike | undefined
  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Exclude<EventStoreAdapter[T], undefined> extends (
      ...args: infer _Args
    ) => infer Result
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Result extends Promise<infer _R>
      ? T
      : never
    : never
  : never

export type EventStoreAdapterAsyncFunctionKeysDistribute<
  T extends EventStoreAdapterKeys
> = T extends any ? EventStoreAdapterIsAsyncFunctionalKey<T> : never

export type EventStoreAdapterAsyncFunctionKeys = EventStoreAdapterAsyncFunctionKeysDistribute<EventStoreAdapterKeys>

export type CommonAdapterPool = {
  monitoring?: MonitoringLike
  performanceTracer?: PerformanceTracerLike
  splitNestedPath: SplitNestedPathMethod
  checkEventsContinuity: CheckEventsContinuityMethod
}

export type CommonAdapterOptions = {
  monitoring?: MonitoringLike
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
  monitoring?: MonitoringLike
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
  Schema: Record<string, string> | null
  IsPaused: boolean
}

export type BuildDirectContinuation = {
  type: 'build-direct-invoke'
  payload: {
    continue: boolean
    timeout?: number
    notificationExtraPayload?: object
  }
}

export type MethodGetRemainingTime = () => number
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
  deliveryStrategy: 'inline-ledger'
  successEvent: ReadModelEvent | null
  failedEvent: ReadModelEvent | null
  errors: Array<Error> | null
  cursor: ReadModelCursor
  status: ReadModelRunStatus
}

export type RuntimeReadModelStatus = ReadModelStatus & {
  isAlive: boolean
}

export type ProjectionMethod<AdapterPool extends CommonAdapterPool> = (
  projectionStore: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
  projectionEvent: ReadModelEvent,
  projectionEncryption?: EncryptionLike
) => Promise<void>

export type OmitObject<T extends object, U extends object> = {
  [K in Exclude<keyof T, keyof U>]: T[K]
}

export type BuildInfo = {
  eventsWithCursors?: Array<EventWithCursor>
  initiator: 'command' | 'command-foreign' | 'read-model-next'
  notificationId: string
  sendTime: number
  coldStart?: boolean
  [key: string]: any
}

export type AdapterConnection<
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
> = {
  connect(pool: AdapterPool, options: AdapterOptions): Promise<void>

  disconnect(pool: AdapterPool): Promise<void>
}

export type AdapterOperationStatusMethodArguments<
  T extends [
    includeRuntimeStatus?: boolean,
    retryTimeoutForRuntimeStatus?: number
  ],
  AdapterPool extends CommonAdapterPool
> = [
  pool: AdapterPool,
  readModelName: string,
  eventstoreAdapter: EventStoreAdapterLike,
  ...args: T
]

export type AdapterOperationStatusMethodReturnType<
  T extends [
    includeRuntimeStatus?: boolean,
    retryTimeoutForRuntimeStatus?: number
  ]
> = Promise<IfEquals<
  T['length'],
  0,
  ReadModelStatus,
  IfEquals<
    T['length'],
    1,
    IfEquals<T[0], true, RuntimeReadModelStatus, ReadModelStatus>,
    IfEquals<
      T['length'],
      2,
      IfEquals<
        T[0],
        true,
        [IsTypeLike<T[1], number>] extends [never]
          ? ReadModelStatus
          : RuntimeReadModelStatus,
        ReadModelStatus
      >,
      never
    >
  >
> | null>

export type AdapterOperations<AdapterPool extends CommonAdapterPool> = {
  subscribe(
    pool: AdapterPool,
    readModelName: string,
    eventTypes: Array<ReadModelEvent['type']> | null,
    aggregateIds: Array<ReadModelEvent['aggregateId']> | null,
    loadProcedureSource: () => Promise<string | null>
  ): Promise<void>

  unsubscribe(
    pool: AdapterPool,
    readModelName: string,
    loadProcedureSource: () => Promise<string | null>
  ): Promise<void>

  resubscribe(
    pool: AdapterPool,
    readModelName: string,
    eventTypes: Array<ReadModelEvent['type']> | null,
    aggregateIds: Array<ReadModelEvent['aggregateId']> | null,
    loadProcedureSource: () => Promise<string | null>
  ): Promise<void>

  resume(
    pool: AdapterPool,
    readModelName: string
  ): Promise<BuildDirectContinuation>

  pause(pool: AdapterPool, readModelName: string): Promise<void>

  reset(pool: AdapterPool, readModelName: string): Promise<void>

  status<
    T extends [
      includeRuntimeStatus?: boolean,
      retryTimeoutForRuntimeStatus?: number
    ]
  >(
    ...args: AdapterOperationStatusMethodArguments<T, AdapterPool>
  ): AdapterOperationStatusMethodReturnType<T>

  build(
    pool: AdapterPool,
    readModelName: string,
    store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
    modelInterop: ReadModelInterop<
      ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>
    >,
    eventstoreAdapter: EventStoreAdapterLike,
    getVacantTimeInMillis: MethodGetRemainingTime,
    buildInfo: BuildInfo
  ): Promise<BuildDirectContinuation>
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

export type WrapIsConditionUnsupportedFormatMethod = <T extends FunctionLike>(
  fn: T
) => T

export type BaseAdapterPool<AdapterPool extends CommonAdapterPool> = {
  commonAdapterPool: CommonAdapterPool
  adapterPoolMap: Map<ReadModelStore<StoreApi<AdapterPool>>, AdapterPool>
  AlreadyDisposedError: AlreadyDisposedErrorFactory
  withPerformanceTracer: WithPerformanceTracerMethod
  monitoring?: MonitoringLike
  performanceTracer?: PerformanceTracerLike
}

export type UnPromise<T> = T extends Promise<infer R> ? R : T

export type ConnectMethod<AdapterPool extends CommonAdapterPool> = (
  readModelName: string
) => Promise<ReadModelStore<StoreApi<AdapterPool>>>

export type WrapWithCloneArgsMethod = <T extends FunctionLike>(fn: T) => T

export type WrapConnectMethod = <
  AdapterPool extends CommonAdapterPool,
  AdapterOptions extends OmitObject<AdapterOptions, CommonAdapterOptions>
>(
  pool: BaseAdapterPool<AdapterPool>,
  wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod,
  wrapWithCloneArgs: WrapWithCloneArgsMethod,
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
infer _Result
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

export type PathToolkitLibInstance = {
  getTokens: (
    input: string
  ) => { t: Array<string>; simple: number | boolean } | null | undefined
  setOptions: (options: any) => void
}

export type PathToolkitLib = {
  new (): PathToolkitLibInstance
}

export type MakeSplitNestedPathMethod = (
  PathToolkitLib: PathToolkitLib
) => SplitNestedPathMethod

export interface AlreadyDisposedErrorInstance extends Error {
  name: string
}

export type AlreadyDisposedErrorFactory = {
  new (): AlreadyDisposedErrorInstance
} & {
  is: (error: Error) => boolean
}

export type BaseAdapterImports = {
  splitNestedPath: SplitNestedPathMethod
  checkEventsContinuity: CheckEventsContinuityMethod
  withPerformanceTracer: WithPerformanceTracerMethod
  AlreadyDisposedError: AlreadyDisposedErrorFactory
  wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod
  wrapWithCloneArgs: WrapWithCloneArgsMethod
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

export type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N

export type IsTypeLike<T, B> = IfEquals<Extract<T, B>, T>

export type ObjectKeys<T> = T extends object
  ? (keyof T)[]
  : T extends number
  ? []
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends Array<infer _R> | string
  ? string[]
  : never

export type ObjectFixedKeysImpl<
  T extends object,
  U = {
    [K in keyof T]: [K]
  },
  Q = U extends {
    [K in keyof U]: infer E
  }
    ? E
    : never
> = T extends any
  ? Q extends [infer U]
    ? string extends U
      ? never
      : number extends U
      ? never
      : U
    : never
  : never

export type ObjectFixedKeys<T extends object> = ObjectFixedKeysImpl<T>

export type DistributeKeysUnion<U> = U extends string | number | symbol
  ? { [K in U]: any }
  : never

export type ObjectDictionaryKeys<T extends object> = Exclude<
  T,
  DistributeKeysUnion<ObjectFixedKeys<T>>
>

export type DistributeFixedFieldsUnionLikeObject<
  U extends object,
  KS extends keyof any
> = U extends any
  ? [IsTypeLike<U, { [K in KS]: any }>] extends [never]
    ? never
    : U
  : never

export type ExtractExactUnionLikeKeyType<
  U extends object,
  K extends keyof any,
  Q extends object = DistributeFixedFieldsUnionLikeObject<U, K>
> = K extends keyof Q ? Q[K] : never

export type DistributeUnionLikeObject<
  U extends object,
  KS = ObjectFixedKeys<U>
> = KS extends keyof any ? ExtractExactUnionLikeKeyType<U, KS> : never

export type ObjectFixedUnionToIntersection<
  U extends object,
  KS = ObjectFixedKeys<U>
> = [KS] extends [keyof any]
  ? {
      [K in KS]: DistributeUnionLikeObject<U>
    }
  : never

export type ObjectFixedUnionToIntersectionByKeys<
  U extends object,
  KS extends keyof any
> = {
  [K in Extract<KS, ObjectFixedKeys<U>>]: DistributeUnionLikeObject<
    U,
    Extract<KS, ObjectFixedKeys<U>>
  >
}

export type ObjectFixedIntersectionToObject<
  T extends object,
  KS = ObjectFixedKeys<T>
> = [KS] extends [keyof any]
  ? {
      [K in KS]: ExtractExactUnionLikeKeyType<T, K>
    }
  : never

export type ObjectFunctionLikeKeys<
  U extends object,
  KS = ObjectFixedKeys<U>
> = KS extends keyof U ? (U[KS] extends FunctionLike ? KS : never) : never

export type JsonLike = JsonPrimitive | JsonArray | JsonMap

export type EnsureExclude<T, U> = [IsTypeLike<U, T>] extends [never]
  ? never
  : Exclude<T, U>

export type MatchTypeConditional<
  M,
  V extends Array<[any, any]>,
  D = never
> = V extends [[infer A, infer B], ...infer T]
  ? T extends Array<[any, any]>
    ? IfEquals<M, A, true, false> extends true
      ? B
      : MatchTypeConditional<M, T, D>
    : D
  : D

export type MatchTypeConditionalLike<
  M,
  V extends Array<[any, any]>,
  D = never
> = V extends [[infer A, infer B], ...infer T]
  ? T extends Array<[any, any]>
    ? IfEquals<Extract<M, A>, M, true, false> extends true
      ? B
      : MatchTypeConditionalLike<M, T, D>
    : D
  : D

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
    ? MatchTypeConditionalLike<
        Result,
        [
          [T, new (...args: Args) => T],
          [null, new (...args: Args) => T],
          [undefined, new (...args: Args) => T],
          [boolean, new (...args: Args) => T],
          [number, new (...args: Args) => T],
          [string, new (...args: Args) => T],
          [void, new (...args: Args) => T]
        ]
      >
    : never
  : never
