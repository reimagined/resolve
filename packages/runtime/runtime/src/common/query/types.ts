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

import type {
  ReadModelConnector,
  InvokeBuildAsync,
  ReadModelMethodName,
} from '../types'

export type CreateQueryOptions = {
  invokeBuildAsync: InvokeBuildAsync
  readModelConnectors: Record<string, ReadModelConnector>
  performanceTracer: PerformanceTracer | null
  getVacantTimeInMillis: () => number
  monitoring?: Monitoring
  readModelsInterop: ReadModelInteropMap | SagaInteropMap
  viewModelsInterop: ViewModelInteropMap
  eventstoreAdapter: Eventstore
  applicationName: string
  loadReadModelProcedure: (name: string) => Promise<string | null>
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
  connector: ReadModelConnector
  connections: Set<any>
  invokeBuildAsync: CreateQueryOptions['invokeBuildAsync']
  getVacantTimeInMillis: CreateQueryOptions['getVacantTimeInMillis']
  loadProcedureSource: () => Promise<string | null>
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

export type PrepareArguments = (
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop,
  connection: any,
  readModelName: string,
  parameters: any
) => any

export type CustomReadModelMethod = PrepareArguments

export type ReadModelOperation = (
  useInlineMethod: boolean,
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop,
  parameters: any
) => Promise<any>

export type ReadModelOperationMethods = Record<
  ReadModelMethodName,
  ReadModelOperation
>

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
} & Partial<Record<ReadModelMethodName, (parameters: any) => Promise<any>>>
