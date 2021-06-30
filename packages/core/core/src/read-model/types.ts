import { SecretsManager, Event, ReadModelChannel } from '../types/core'
import { Monitoring } from '../types/runtime'

export type ReadModelRuntimeResolver = (
  connection: any,
  secretsManager: SecretsManager | null
) => Promise<any>

export type ReadModelRuntimeEventHandler = () => Promise<void>

export type ReadModelRuntimeChannel = ReadModelChannel

export type ReadModelRuntime = {
  secretsManager: SecretsManager
  monitoring?: Monitoring
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
  acquireChannel: () => Promise<ReadModelRuntimeChannel | null>
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

export type ReadModelChannelPermit = {
  channel: string
  permit: string
}
