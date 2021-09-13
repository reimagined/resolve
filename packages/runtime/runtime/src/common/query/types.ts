import {
  Monitoring,
  ReadModelInteropMap,
  SagaInteropMap,
  SagaInterop,
  ReadModelInterop,
  ViewModelInteropMap,
  ViewModelInterop,
  Eventstore,
  PerformanceTracer,
} from '@resolve-js/core'

import type { ReadModelConnector, InvokeBuildAsync } from '../types'

export type CreateQueryOptions = {
  invokeBuildAsync: InvokeBuildAsync
  readModelConnectors: Record<string, ReadModelConnector>
  readModelSources?: Record<string, string | null>
  performanceTracer: PerformanceTracer | null
  getVacantTimeInMillis: () => number
  monitoring?: Monitoring
  readModelsInterop: ReadModelInteropMap | SagaInteropMap
  viewModelsInterop: ViewModelInteropMap
  eventstoreAdapter: Eventstore
  applicationName: string
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
  invokeBuildAsync: Function
  getVacantTimeInMillis: Function
  readModelSource?: any
  monitoring?: Monitoring
  eventstoreAdapter: Eventstore
  applicationName: string
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
