import type {
  ObjectFixedIntersectionToObject,
  CommonAdapterPool,
  CommonAdapterOptions,
  AdapterOperations,
  AdapterConnection,
  AdapterImplementation,
  StoreApi,
  PerformanceTracerLike,
  SplitNestedPathMethod,
  ReadModelLedger,
  JsonMap,
  SearchCondition,
  UpdateCondition,
  ObjectFixedKeys,
  OmitObject,
  EventThreadData,
} from '@resolve-js/readmodel-base'

import type PGLib from 'pg'
export * from '@resolve-js/readmodel-base'

export type LibDependencies = {
  Postgres: typeof PGLib.Client
}

export type InlineLedgerRunQueryMethod = (
  querySQL: string,
  passthroughRuntimeErrors?: boolean
) => Promise<Array<object>>

export type FullJitterMethod = (retries: number) => Promise<void>
export type MakeNestedPathMethod = (nestedPath: Array<string>) => string
export type EscapeableMethod = (str: string) => string

export type InlineLedgerForceStopMethod = (
  pool: AdapterPool,
  readModelName: string
) => Promise<void>

export type BuildUpsertDocumentMethod = (
  searchExpression: Parameters<StoreApi<CommonAdapterPool>['update']>[3],
  updateExpression: Parameters<StoreApi<CommonAdapterPool>['update']>[4],
  splitNestedPath: SplitNestedPathMethod
) => JsonMap

export type RowLike = JsonMap
export type MarshalledRowLike = RowLike & { marshalled: 'marshalled' }

export type ConvertResultRowMethod = (
  inputRow: MarshalledRowLike,
  fieldList: Parameters<StoreApi<CommonAdapterPool>['find']>[4] | null
) => RowLike

export type SearchToWhereExpressionMethod = (
  expression: SearchCondition,
  escapeId: EscapeableMethod,
  escapeStr: EscapeableMethod,
  makeNestedPath: MakeNestedPathMethod,
  splitNestedPath: SplitNestedPathMethod
) => string

export type UpdateToSetExpressionMethod = (
  expression: UpdateCondition,
  escapeId: EscapeableMethod,
  escapeStr: EscapeableMethod,
  makeNestedPath: MakeNestedPathMethod,
  splitNestedPath: SplitNestedPathMethod
) => string

export interface PassthroughErrorInstance extends Error {
  name: string
  isRetryable: boolean
}

export type PassthroughErrorLike = Error & {
  code: string | number
  stack: string
}

export type PassthroughErrorFactory = {
  new (isRetryable: boolean): PassthroughErrorInstance
} & {
  isRetryablePassthroughError: (error: PassthroughErrorLike) => boolean
  isRegularFatalPassthroughError: (error: PassthroughErrorLike) => boolean
  isRuntimeFatalPassthroughError: (error: PassthroughErrorLike) => boolean
  isPassthroughError: (
    error: PassthroughErrorLike,
    includeRuntimeErrors: boolean
  ) => boolean
  maybeThrowPassthroughError: (
    error: PassthroughErrorLike,
    includeRuntimeErrors: boolean
  ) => void
}

export type GenerateGuidMethod = (...args: any) => string

export type DropReadModelMethod = (
  pool: AdapterPool,
  readModelName: string
) => Promise<void>

export type BuildMode = 'auto' | 'plv8' | 'nodejs'

export type AdapterOptions = CommonAdapterOptions & {
  buildMode?: BuildMode
  tablePrefix?: string
  databaseName: string
} & PGLib.ConnectionConfig

export type MaybeInitMethod = (pool: AdapterPool) => Promise<void>

export type MakeSqlQueryMethodTargetParameters<
  T extends keyof CurrentStoreApi
> = Parameters<CurrentStoreApi[T]> extends [infer _, infer __, ...infer Args] // eslint-disable-line @typescript-eslint/no-unused-vars
  ? Args
  : never

export type MakeSqlQueryMethod = <T extends keyof CurrentStoreApi>(
  methods: AdapterPool,
  readModelName: string,
  operation: T,
  ...args: MakeSqlQueryMethodTargetParameters<T>
) => string

export type InternalMethods = {
  inlineLedgerForceStop: InlineLedgerForceStopMethod
  buildUpsertDocument: BuildUpsertDocumentMethod
  convertResultRow: ConvertResultRowMethod
  searchToWhereExpression: SearchToWhereExpressionMethod
  updateToSetExpression: UpdateToSetExpressionMethod
  makeNestedPath: MakeNestedPathMethod
  makeSqlQuery: MakeSqlQueryMethod
  PassthroughError: PassthroughErrorFactory
  generateGuid: GenerateGuidMethod
  dropReadModel: DropReadModelMethod
  escapeId: EscapeableMethod
  escapeStr: EscapeableMethod
  maybeInit: MaybeInitMethod
}

export type ArrayOrSingleOrNull<T> = Array<T> | T | null

export type UpdateFieldDescriptor = {
  [K in ObjectFixedKeys<ObjectFixedIntersectionToObject<UpdateCondition>>]:
    | ObjectFixedIntersectionToObject<UpdateCondition>[K][string]
    | null
} & {
  key: string
  nestedKey: string[]
  baseName: string
  selectedOperation: ObjectFixedKeys<UpdateCondition> | null
  children: Map<string, UpdateFieldDescriptor>
  operations?: ArrayOrSingleOrNull<{
    operationName: ObjectFixedKeys<UpdateCondition> | null
    fieldValue: UpdateFieldDescriptor[ObjectFixedKeys<UpdateCondition>]
    nestedPath?: string[]
  }>
}

export type AdapterPool = CommonAdapterPool & {
  inlineLedgerRunQuery: InlineLedgerRunQueryMethod
  performanceTracer: PerformanceTracerLike
  tablePrefix: string
  schemaName: string
  makeNestedPath: MakeNestedPathMethod
  activePassthrough: boolean
  connection: InstanceType<LibDependencies['Postgres']>
  buildMode: BuildMode
} & {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterOperations<AdapterPool>[K]
  } &
  {
    [K in keyof StoreApi<CommonAdapterPool>]: StoreApi<AdapterPool>[K]
  } &
  InternalMethods

export type CurrentAdapterConnection = AdapterConnection<
  AdapterPool,
  OmitObject<AdapterOptions, CommonAdapterPool>
>

export type ExternalMethods = {
  [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterPool[K]
}

export type CurrentStoreApi = {
  [K in keyof StoreApi<CommonAdapterPool>]: AdapterPool[K]
}

export type ConnectionDependencies = LibDependencies &
  InternalMethods &
  ExternalMethods &
  CurrentStoreApi

export type CurrentConnectMethod = (
  imports: ConnectionDependencies,
  ...args: Parameters<CurrentAdapterConnection['connect']>
) => ReturnType<CurrentAdapterConnection['connect']>

export type CurrentDisconnectMethod = CurrentAdapterConnection['disconnect']

export type CurrentAdapterImplementation = AdapterImplementation<
  AdapterPool,
  AdapterOptions
>

export type AdminOptions = PGLib.ConnectionConfig & {
  databaseName: string
  userLogin: string
}

export type ReadModelProcedureLedger = ReadModelLedger & {
  IsProcedural: boolean
}

export type ProcedureResult = {
  appliedEventsThreadData: Array<EventThreadData>
  status: 'OK_ALL' | 'OK_PARTIAL' | 'CUSTOM_ERROR' | 'DEPENDENCY_ERROR'
  successEvent: Event | null
  failureEvent: Event | null
  failureError: Error | null
  appliedCount: number
}

export type BoundResourceMethod = (options: AdminOptions) => Promise<void>

export type UnboundResourceMethod = (
  pool: AdminPool,
  options: AdminOptions
) => Promise<void>

export type AdminPool = {
  connect: CurrentAdapterImplementation['connect']
  disconnect: CurrentAdapterImplementation['disconnect']
  escapeStr: EscapeableMethod
  escapeId: EscapeableMethod
  createResource: BoundResourceMethod
  destroyResource: BoundResourceMethod
}
