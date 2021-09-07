import type {
  CommonAdapterPool,
  CommonAdapterOptions,
  AdapterOperations,
  AdapterConnection,
  AdapterImplementation,
  StoreApi,
  PerformanceTracerLike,
  SplitNestedPathMethod,
  JsonMap,
  SearchCondition,
  UpdateCondition,
  OmitObject,
  IfEquals,
  IsTypeLike,
} from '@resolve-js/readmodel-base'

import type SQLiteLib from 'better-sqlite3'
import type OsLib from 'os'
import type FsLib from 'fs'

export * from '@resolve-js/readmodel-base'

export type TmpLib = {
  fileSync: () => {
    name: string
    removeCallback: () => {}
  }
}

export type MemoryStore = {
  name: string
  drop: () => {}
}

export type LibDependencies = {
  SQLite: typeof SQLiteLib
  tmp: TmpLib
  os: typeof OsLib
  fs: typeof FsLib
  memoryStore: MemoryStore
}

export type CommonRunQueryMethodUnpromiseResult<T> = IfEquals<
  IsTypeLike<T, false>,
  unknown,
  Array<object>,
  IfEquals<
    IsTypeLike<T, true>,
    unknown,
    null,
    IfEquals<IsTypeLike<T, boolean>, unknown, Array<object>, never>
  >
>

export type InlineLedgerRunQueryMethod = <T extends true | false>(
  sqlQuery: string,
  multiLine?: T,
  passthroughRuntimeErrors?: boolean
) => Promise<CommonRunQueryMethodUnpromiseResult<T>>

export type FullJitterMethod = (retries: number) => Promise<void>
export type MakeNestedPathMethod = (nestedPath: Array<string>) => string
export type EscapeableMethod = (str: string) => string

export type BuildUpsertDocumentMethod = (
  searchExpression: Parameters<StoreApi<CommonAdapterPool>['update']>[3],
  updateExpression: Parameters<StoreApi<CommonAdapterPool>['update']>[4],
  splitNestedPath: SplitNestedPathMethod
) => JsonMap

export type RowLike = JsonMap
export type MarshalledRowLike = RowLike & { marshalled: 'marshalled' }

export type ConvertBinaryRowMethod = (
  inputRow: MarshalledRowLike,
  readModelName: string,
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
) => Array<string>

export interface PassthroughErrorInstance extends Error {
  isRuntimeError: boolean
  name: string
}

export type PassthroughErrorFactory = {
  new (isRuntimeError: boolean): PassthroughErrorInstance
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
  databaseFile: string
}

export type MaybeInitMethod = (pool: AdapterPool) => Promise<void>

export type InternalMethods = {
  buildUpsertDocument: BuildUpsertDocumentMethod
  convertBinaryRow: ConvertBinaryRowMethod
  searchToWhereExpression: SearchToWhereExpressionMethod
  updateToSetExpression: UpdateToSetExpressionMethod
  PassthroughError: PassthroughErrorFactory
  generateGuid: GenerateGuidMethod
  dropReadModel: DropReadModelMethod
  maybeInit: MaybeInitMethod
}

export type AdapterPool = CommonAdapterPool & {
  memoryStore: MemoryStore
  inlineLedgerRunQuery: InlineLedgerRunQueryMethod
  fullJitter: FullJitterMethod
  performanceTracer: PerformanceTracerLike
  tablePrefix: string
  databaseFile: string
  makeNestedPath: MakeNestedPathMethod
  escapeId: EscapeableMethod
  escapeStr: EscapeableMethod
  connectionUri: string
  connection: typeof SQLiteLib['prototype']
  activePassthrough: boolean
} & {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterOperations<AdapterPool>[K]
  } &
  {
    [K in keyof StoreApi<CommonAdapterPool>]: StoreApi<AdapterPool>[K]
  } &
  InternalMethods

export type CurrentAdapterConnection = AdapterConnection<
  AdapterPool,
  OmitObject<AdapterOptions, CommonAdapterOptions>
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
