import { SecretsManager } from '../types/core'
import { Eventstore, Monitoring, ViewModelSerializer } from '../types/runtime'

export type ViewModelBuildParams = {
  aggregateIds: string[]
  aggregateArgs: any
}

export type ViewModelBuildContext = {
  jwt?: string
}

export type ViewModelBuildResult = {
  data: any
  eventCount: number
  cursor: string | null
}

export type ViewModelRuntime = {
  monitoring?: Monitoring
  eventstore: Eventstore
  secretsManager: SecretsManager
}

export type ViewModelRuntimeResolver = () => Promise<ViewModelBuildResult>

export type ViewModelInterop = {
  name: string
  serialize: ViewModelSerializer
  acquireResolver: (
    params: ViewModelBuildParams,
    context: ViewModelBuildContext
  ) => Promise<ViewModelRuntimeResolver>
}

export type ViewModelInteropMap = {
  [key: string]: ViewModelInterop
}

export type ViewModelsInteropBuilder = (
  runtime: ViewModelRuntime
) => ViewModelInteropMap

export type ViewModelDomain = {
  acquireViewModelsInterop: ViewModelsInteropBuilder
}
