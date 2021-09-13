import type {
  Monitoring,
  ReadModelInteropMap,
  SagaInteropMap,
  SagaInterop,
  ReadModelInterop,
  ViewModelInteropMap,
  ViewModelInterop,
  Eventstore,
  PerformanceTracer,
  MiddlewareContext,
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
  CreateQueryOptions,
  'readModels' | 'viewModels' | 'readModelsInterop' | 'viewModelsInterop'
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
  performanceTracer: CreateQueryOptions['performanceTracer']
  isDisposed: boolean
  connector: any
  connections: Set<any>
  invokeBuildAsync: CreateQueryOptions['invokeBuildAsync']
  getVacantTimeInMillis: CreateQueryOptions['getVacantTimeInMillis']
  readModelSource?: string | null
  monitoring?: Monitoring
  eventstoreAdapter: Eventstore
  applicationName: string
}

export type ViewModelPool = {
  performanceTracer: CreateQueryOptions['performanceTracer']
  isDisposed: boolean
  monitoring?: Monitoring
}

export type BuildViewModelQuery = {
  aggregateIds: Array<string> | null
  aggregateArgs: any
}

export type WrappedViewModel = {
  dispose: () => Promise<void>
  read: (params: { jwt?: string } & Record<string, any>) => Promise<any>
  serializeState: (params: { state: any; jwt?: string }) => Promise<string>
}

//TODO: further types
export type WrappedReadModel = {
  dispose: () => Promise<void>
  read: (
    params: { jwt?: string } & Record<string, any>,
    middlewareContext?: MiddlewareContext
  ) => Promise<any>
  serializeState: (params: { state: any }) => Promise<string>

  deleteProperty: (parameters: { key: string }) => Promise<void>
  getProperty: (parameters: { key: string }) => Promise<any>
  listProperties: (parameters: {}) => Promise<any>
  setProperty: (parameters: { key: string; value: any }) => Promise<void>
}
