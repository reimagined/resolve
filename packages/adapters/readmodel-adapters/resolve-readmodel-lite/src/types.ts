import type {
    CommonAdapterPool,
    CommonAdapterOptions,
    AdapterOperations,
    ConnectMethod,
    DisconnectMethod,
    StoreApi,
    PerformanceTracerLike,
    ObjectFixedUnionToIntersectionByKeys,
    ObjectDictionaryKeys,
    ObjectFixedKeys,
    ProjectionMethod,
    FunctionLike,
    JsonPrimitive,
    JsonArray,
    JsonMap,
    SearchCondition,
    JsonLike,
    IfEquals,
    IsTypeLike
} from 'resolve-readmodel-base'

import type SQLiteLib from 'sqlite'
import type OsLib from 'os'
import type FsLib from 'fs'

export {
    CommonAdapterPool,
    CommonAdapterOptions,
    AdapterOperations,
    ConnectMethod,
    DisconnectMethod,
    StoreApi,
    PerformanceTracerLike,
    ObjectFixedUnionToIntersectionByKeys,
    ObjectDictionaryKeys,
    ObjectFixedKeys,
    ProjectionMethod,
    FunctionLike,
    JsonPrimitive,
    JsonArray,
    JsonMap,
    SearchCondition,
    JsonLike,
    IfEquals,
    IsTypeLike
}

export type TmpLib = {
    fileSync: () => {
      name: string,
      removeCallback: () => {}
    }
}

export type LibDependencies = {
    SQLite: typeof SQLiteLib,
    tmp: TmpLib,
    os: typeof OsLib,
    fs: typeof FsLib,
    memoryStore: any
  }


export type CommonRunQueryMethodUnpromiseResult<T> = IfEquals<(IsTypeLike<T, false>), unknown, Array<object>, (IfEquals<(IsTypeLike<T, true>), unknown, null, never>) >
export type CommonRunQueryMethodArgs<T, F extends boolean> = F extends true
  ? [pool: AdapterPool, isInlineLedger: boolean, sqlQuery: string, multiLine: T, passthroughRuntimeErrors: boolean]
  : [sqlQuery: string, multiLine: T, passthroughRuntimeErrors: boolean]


export type CommonRunQueryMethod = <T extends (true|false)>(...args: CommonRunQueryMethodArgs<T, true>) => Promise<CommonRunQueryMethodUnpromiseResult<T>>
export type InlineLedgerRunQueryMethod = <T extends (true|false)>(...args: CommonRunQueryMethodArgs<T, false>) => Promise<CommonRunQueryMethodUnpromiseResult<T>>
export type RunQueryMethod = <T extends (true|false)>(...args: CommonRunQueryMethodArgs<T, false>) => Promise<CommonRunQueryMethodUnpromiseResult<T>>

export type FullJitterMethod = (retries: number) => Promise<void>
export type MakeNestedPathMethod = (nestedPath: Array<string>) => string
export type EscapeableMethod = (str: string) => string

export type BuildUpsertDocumentMethod = (
  searchExpression: Parameters<StoreApi<CommonAdapterPool>["update"]>[3],
  updateExpression: Parameters<StoreApi<CommonAdapterPool>["update"]>[4]
) => JsonMap

export type RowLike = JsonMap
export type MarshalledRowLike = RowLike & { marshalled: 'marshalled' }

export type ConvertBinaryRowMethod = (
  inputRow: MarshalledRowLike,
  readModelName: string,
  fieldList: Parameters<StoreApi<CommonAdapterPool>["find"]>[4] | null
) => RowLike


export type SearchToWhereExpressionMethod = (
  expression: SearchCondition,
  escapeId: EscapeableMethod,
  escapeStr: EscapeableMethod,
  makeNestedPath: MakeNestedPathMethod
) => string


export type UpdateToSetExpressionMethod = any
export type PassthroughError = any
export type GenerateGuidMethod = any

type AdapterOptions = CommonAdapterOptions & {
    tablePrefix: string
    databaseFile: string
}

export type AdapterPool = CommonAdapterPool & {
    inlineLedgerRunQuery: InlineLedgerRunQueryMethod,
    runQuery: RunQueryMethod,
    fullJitter: FullJitterMethod,
    connectionOptions: Omit<Omit<AdapterOptions, "tablePrefix">, "databaseFile">,
    performanceTracer: PerformanceTracerLike,
    tablePrefix: string,
    databaseFile: string,
    makeNestedPath: MakeNestedPathMethod,
    escapeId: EscapeableMethod,
    escapeStr: EscapeableMethod,
    buildUpsertDocument: BuildUpsertDocumentMethod,
    convertBinaryRow: ConvertBinaryRowMethod,
    searchToWhereExpression: SearchToWhereExpressionMethod,
    updateToSetExpression: UpdateToSetExpressionMethod,
    PassthroughError: PassthroughError,
    generateGuid: GenerateGuidMethod,
    connection: any

} & {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterOperations<AdapterPool>[K]
} & {
    [K in keyof StoreApi<CommonAdapterPool>]: StoreApi<AdapterPool>[K]
}

export type ExternalMethods = {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterPool[K]
}

export type CurrentStoreApi = {
    [K in keyof StoreApi<CommonAdapterPool>]: AdapterPool[K]
}

