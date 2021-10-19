import { SecretsManager, Event } from '../types/core'
import {
  MiddlewareContext,
  Monitoring,
  ReadModelProjectionMiddleware,
  ReadModelResolverMiddleware,
} from '../types/runtime'

export type ReadModelRuntimeResolver = (
  connection: any,
  secretsManager: SecretsManager | null
) => Promise<any>

export type ReadModelRuntimeEventHandler = () => Promise<void>

export type ReadModelRuntime = {
  secretsManager: SecretsManager
  monitoring?: Monitoring
  resolverMiddlewares?: Array<ReadModelResolverMiddleware>
  projectionMiddlewares?: Array<ReadModelProjectionMiddleware>
}

export type ReadModelInterop<TStore = any> = {
  name: string
  connectorName: string
  acquireResolver: (
    resolver: string,
    args: any,
    context: {
      jwt?: string
    },
    middlewareContext?: MiddlewareContext
  ) => Promise<ReadModelRuntimeResolver>
  acquireInitHandler: (
    store: TStore
  ) => Promise<ReadModelRuntimeEventHandler | null>
  acquireEventHandler: (
    store: TStore,
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
