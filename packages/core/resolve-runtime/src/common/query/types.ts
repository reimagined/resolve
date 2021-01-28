import {
  IS_BUILT_IN,
  Monitoring,
  ReadModelInteropMap,
  SagaInteropMap,
  SagaInterop,
  ReadModelInterop,
  ViewModelInteropMap,
  ViewModelInterop,
} from 'resolve-core'

export type CreateQueryOptions = {
  invokeEventBusAsync: Function
  readModelConnectors: any
  performanceTracer: any
  eventstoreAdapter: any
  getVacantTimeInMillis: any
  performAcknowledge: any
  monitoring?: Monitoring
  readModelsInterop: ReadModelInteropMap | SagaInteropMap
  viewModelsInterop: ViewModelInteropMap
  provideLedger: (ledger: any) => Promise<void>
}

type WrapModelOptions = Omit<
  Omit<
    Omit<Omit<CreateQueryOptions, 'readModels'>, 'viewModels'>,
    'readModelsInterop'
  >,
  'viewModelsInterop'
>

export type WrapReadModelOptions = WrapModelOptions & {
  interop: ReadModelInterop | SagaInterop
}
export type WrapViewModelOptions = WrapModelOptions & {
  interop: ViewModelInterop
}

export type EventStoreAdapter = {
  loadEvents: Function
  getNextCursor: Function
}

export interface Serializer {
  (state: any, jwt: string): string
  [IS_BUILT_IN]?: boolean
}

export interface Deserializer {
  (data: string): any
  [IS_BUILT_IN]?: boolean
}

export type SerializedError = {
  name: string | null
  code: string | null
  message: string
  stack: string
}

export type ReadModelMeta = {
  name: string
  resolvers: { [key: string]: any }
  projection: { [key: string]: Function }
  connectorName: string
  encryption: Function
}

export type ReadModelPool = {
  performanceTracer: any
  eventstoreAdapter: any
  isDisposed: boolean
  connector: any
  connections: Set<any>
  invokeEventBusAsync: Function
  performAcknowledge: Function
  getVacantTimeInMillis: Function
  monitoring?: Monitoring
  provideLedger: (ledger: any) => Promise<void>
}

export type ViewModelMeta = {
  name: string
  invariantHash: string
  deserializeState: Deserializer
  serializeState: Serializer
  projection: { [key: string]: Function }
  resolver: Function
  encryption: Function
}

export type ViewModelPool = {
  eventstoreAdapter: any
  getSecretsManager: Function
  performanceTracer: any
  isDisposed: boolean
  monitoring?: Monitoring
}

export type BuildViewModelQuery = {
  aggregateIds: Array<string> | null
  aggregateArgs: any
}
