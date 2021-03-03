import type {
  ObjectFixedIntersectionToObject,
  CommonAdapterPool,
  CommonAdapterOptions,
  AdapterOperations,
  AdapterConnection,
  AdapterImplementation,
  StoreApi,
  PerformanceTracerLike,
  JsonMap,
  SearchCondition,
  UpdateCondition,
  ObjectFixedKeys,
  OmitObject,
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
  updateExpression: Parameters<StoreApi<CommonAdapterPool>['update']>[4]
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
  makeNestedPath: MakeNestedPathMethod
) => string

export type UpdateToSetExpressionMethod = (
  expression: UpdateCondition,
  escapeId: EscapeableMethod,
  escapeStr: EscapeableMethod,
  makeNestedPath: MakeNestedPathMethod
) => string

export interface PassthroughErrorInstance extends Error {
  name: string
}

export type PassthroughErrorFactory = {
  new (): PassthroughErrorInstance
} & {
  isPassthroughError: (
    error: Error & { code: string | number },
    includeRuntimeErrors: boolean
  ) => boolean
}

export type GenerateGuidMethod = (...args: any) => string

export type DropReadModelMethod = (
  pool: AdapterPool,
  readModelName: string
) => Promise<void>

export type AdapterOptions = CommonAdapterOptions & {
  tablePrefix?: string
  databaseName: string
} & PGLib.ConnectionConfig

export type InternalMethods = {
  inlineLedgerForceStop: InlineLedgerForceStopMethod
  buildUpsertDocument: BuildUpsertDocumentMethod
  convertResultRow: ConvertResultRowMethod
  searchToWhereExpression: SearchToWhereExpressionMethod
  updateToSetExpression: UpdateToSetExpressionMethod
  PassthroughError: PassthroughErrorFactory
  generateGuid: GenerateGuidMethod
  dropReadModel: DropReadModelMethod
  escapeId: EscapeableMethod
  escapeStr: EscapeableMethod
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
} & {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterOperations<
      AdapterPool
    >[K]
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
