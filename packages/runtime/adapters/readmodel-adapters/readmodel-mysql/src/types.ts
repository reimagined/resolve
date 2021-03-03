import type {
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
  OmitObject,
} from '@resolve-js/readmodel-base'

import type MySQLPromiseLib from 'mysql2/promise'
import type { escape as _EscapeableMethod } from 'mysql2'
export * from '@resolve-js/readmodel-base'

export type EscapeableMethod = typeof _EscapeableMethod

export type LibDependencies = {
  MySQL: typeof MySQLPromiseLib
}

export type InlineLedgerRunQueryMethod = (
  querySQL: string,
  passthroughRuntimeErrors?: boolean
) => Promise<Array<object>>

export type FullJitterMethod = (retries: number) => Promise<void>
export type MakeNestedPathMethod = (nestedPath: Array<string>) => string

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

export type ConvertBinaryRowMethod = (
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
    error: Error & { errno: string | number },
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
} & MySQLPromiseLib.ConnectionOptions

export type InternalMethods = {
  inlineLedgerForceStop: InlineLedgerForceStopMethod
  buildUpsertDocument: BuildUpsertDocumentMethod
  convertBinaryRow: ConvertBinaryRowMethod
  searchToWhereExpression: SearchToWhereExpressionMethod
  updateToSetExpression: UpdateToSetExpressionMethod
  PassthroughError: PassthroughErrorFactory
  generateGuid: GenerateGuidMethod
  dropReadModel: DropReadModelMethod
  escapeId: EscapeableMethod
  escapeStr: EscapeableMethod
}

export type AdapterPool = CommonAdapterPool & {
  inlineLedgerRunQuery: InlineLedgerRunQueryMethod
  fullJitter: FullJitterMethod
  connectionOptions: Omit<Omit<AdapterOptions, 'tablePrefix'>, 'databaseFile'>
  performanceTracer: PerformanceTracerLike
  tablePrefix: string
  databaseFile: string
  makeNestedPath: MakeNestedPathMethod
  connection: MySQLPromiseLib.Connection
  activePassthrough: boolean
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
