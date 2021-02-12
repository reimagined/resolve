import {
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
  getVacantTimeInMillis: any
  performAcknowledge: any
  monitoring?: Monitoring
  readModelsInterop: ReadModelInteropMap | SagaInteropMap
  viewModelsInterop: ViewModelInteropMap
  provideLedger: (ledger: any) => Promise<void>
  eventstoreAdapter: EventStoreAdapter
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

export type SerializedError = {
  name: string | null
  code: string | null
  message: string
  stack: string
}

export type ReadModelPool = {
  performanceTracer: any
  isDisposed: boolean
  connector: any
  connections: Set<any>
  invokeEventBusAsync: Function
  performAcknowledge: Function
  getVacantTimeInMillis: Function
  monitoring?: Monitoring
  provideLedger: (ledger: any) => Promise<void>
  eventstoreAdapter: EventStoreAdapter
}

export type ViewModelPool = {
  performanceTracer: any
  isDisposed: boolean
  monitoring?: Monitoring
}

export type BuildViewModelQuery = {
  aggregateIds: Array<string> | null
  aggregateArgs: any
}
