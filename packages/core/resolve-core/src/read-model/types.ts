import { SecretsManager, Event } from '../type-definitions/core'
import { Monitoring } from '../type-definitions/runtime'

export type ReadModelResolverParams = {
  [key: string]: any
}
export type ReadModelResolverContext = {
  jwt?: string
  secretsManager: SecretsManager | null
}
export type ReadModelResolver = (
  connection: any,
  params: ReadModelResolverParams,
  context: ReadModelResolverContext
) => Promise<any>

export type ReadModelRuntimeResolver = (
  connection: any,
  secretsManager: SecretsManager | null
) => Promise<any>

export type ReadModelResolverMap = {
  [key: string]: ReadModelResolver
}

export type ReadModelRuntimeEventHandler = () => Promise<void>

export type ReadModelRuntime = {
  secretsManager: SecretsManager
  monitoring: Monitoring
}

export type ReadModelInterop = {
  name: string
  connectorName: string
  acquireResolver: (
    resolver: string,
    args: any,
    context: {
      jwt?: string
    }
  ) => Promise<ReadModelRuntimeResolver>
  acquireInitHandler: (
    store: any
  ) => Promise<ReadModelRuntimeEventHandler | null>
  acquireEventHandler: (
    store: any,
    event: Event
  ) => Promise<ReadModelRuntimeEventHandler | null>
}

export type ReadModelInteropMap = {
  [key: string]: ReadModelInterop
}

export type ReadModelsInteropBuilder = (
  runtime: ReadModelRuntime
) => ReadModelInteropMap

export type ReadModelDomain = {
  acquireReadModelsInterop: ReadModelsInteropBuilder
}
