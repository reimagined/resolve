import { IS_BUILT_IN } from 'resolve-core'

export type Monitoring = {
  error?: (error: Error, part: string, meta: any) => Promise<void>
}

export type CreateQueryOptions = {
  invokeEventBusAsync: Function
  readModelConnectors: any
  readModels: any[]
  viewModels: any[]
  performanceTracer: any
  eventstoreAdapter: any
  getVacantTimeInMillis: any
  performAcknowledge: any
  monitoring?: Monitoring
}

type WrapModelOptions = Omit<
  Omit<CreateQueryOptions, 'readModels'>,
  'viewModels'
>

export type WrapReadModelOptions = WrapModelOptions & { readModel: any }
export type WrapViewModelOptions = WrapModelOptions & { viewModel: any }

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
  readModel: ReadModelMeta
  invokeEventBusAsync: Function
  performAcknowledge: Function
  getVacantTimeInMillis: Function
  monitoring?: Monitoring
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
  viewModel: ViewModelMeta
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
