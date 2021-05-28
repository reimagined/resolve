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
  JsonMap,
  SearchCondition,
  UpdateCondition,
  ObjectFixedKeys,
  OmitObject,
  JsonPrimitive,
  IfEquals,
} from '@resolve-js/readmodel-base'

import type RDSDataService from 'aws-sdk/clients/rdsdataservice'
import type crypto from 'crypto'
export * from '@resolve-js/readmodel-base'

export type LibDependencies = {
  RDSDataService: typeof RDSDataService
  crypto: typeof crypto
}

export type InlineLedgerExecuteStatementMethod = ((
  pool: AdapterPool,
  querySQL: string,
  transactionId?: string | null | symbol,
  passthroughRuntimeErrors?: boolean
) => Promise<Array<object>>) & {
  SHARED_TRANSACTION_ID: symbol
}

export type InlineLedgerExecuteTransactionMethodNames =
  | 'begin'
  | 'commit'
  | 'rollback'
export type InlineLedgerExecuteTransactionMethodParameters<
  MethodName extends InlineLedgerExecuteTransactionMethodNames
> = [
  pool: AdapterPool,
  method: MethodName,
  ...args: IfEquals<
    MethodName,
    'begin',
    [],
    IfEquals<
      MethodName,
      'commit',
      [transactionId: string],
      IfEquals<MethodName, 'rollback', [transactionId: string], never>
    >
  >
]
export type InlineLedgerExecuteTransactionMethodReturnType<
  MethodName extends InlineLedgerExecuteTransactionMethodNames
> = IfEquals<
  MethodName,
  'begin',
  string,
  IfEquals<
    MethodName,
    'commit',
    null | undefined,
    IfEquals<MethodName, 'rollback', null | undefined, never>
  >
>

export type InlineLedgerExecuteTransactionMethod = <
  MethodName extends InlineLedgerExecuteTransactionMethodNames
>(
  ...args: InlineLedgerExecuteTransactionMethodParameters<MethodName>
) => Promise<InlineLedgerExecuteTransactionMethodReturnType<MethodName>>

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
  lastTransactionId: string | null | undefined
  isRetryable: boolean
  isEmptyTransaction: boolean
}

export type PassthroughErrorLike = Error & {
  code: string | number
  stack: string
}

export type PassthroughErrorFactory = {
  new (
    lastTransactionId: string | null | undefined,
    isRetryable: boolean,
    isEmptyTransaction: boolean
  ): PassthroughErrorInstance
} & {
  isShortCircuitPassthroughError: (error: PassthroughErrorLike) => boolean
  isRetryablePassthroughError: (error: PassthroughErrorLike) => boolean
  isRegularFatalPassthroughError: (error: PassthroughErrorLike) => boolean
  isRuntimeFatalPassthroughError: (error: PassthroughErrorLike) => boolean
  isPassthroughError: (
    error: PassthroughErrorLike,
    includeRuntimeErrors: boolean
  ) => boolean
  isEmptyTransactionError: (error: PassthroughErrorLike) => boolean
  maybeThrowPassthroughError: (
    error: PassthroughErrorLike,
    transactionId: string | null,
    includeRuntimeErrors: boolean
  ) => void
}

export type GenerateGuidMethod = (...args: any) => string

export type DropReadModelMethod = (
  pool: AdapterPool,
  readModelName: string
) => Promise<void>

export type AdapterOptions = CommonAdapterOptions & {
  dbClusterOrInstanceArn: RDSDataService.Arn
  awsSecretStoreArn: RDSDataService.Arn
  databaseName: RDSDataService.DbName
  tablePrefix?: string
} & RDSDataService.ClientConfiguration

export type MaybeInitMethod = (pool: AdapterPool) => Promise<void>

export type InternalMethods = {
  inlineLedgerExecuteTransaction: InlineLedgerExecuteTransactionMethod
  inlineLedgerExecuteStatement: InlineLedgerExecuteStatementMethod
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
  maybeInit: MaybeInitMethod
  coercer: CoercerMethod
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

export type CoercerMethod = (value: {
  intValue?: number
  stringValue?: string
  bigIntValue?: number
  longValue?: number
  booleanValue?: boolean
  isNull?: boolean
}) => JsonPrimitive

export type AdapterPool = CommonAdapterPool & {
  hash512: (str: string) => string
  performanceTracer: PerformanceTracerLike
  makeNestedPath: MakeNestedPathMethod
  rdsDataService: InstanceType<LibDependencies['RDSDataService']>
  dbClusterOrInstanceArn: RDSDataService.Arn
  awsSecretStoreArn: RDSDataService.Arn
  schemaName: RDSDataService.DbName
  tablePrefix: string
  sharedTransactionId?: string | null | undefined
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

export type AdminOptions = {
  awsSecretStoreAdminArn: AdapterOptions['awsSecretStoreArn']
  dbClusterOrInstanceArn: AdapterOptions['dbClusterOrInstanceArn']
  databaseName: AdapterOptions['databaseName']
  region: AdapterOptions['region']
  userLogin: string
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
