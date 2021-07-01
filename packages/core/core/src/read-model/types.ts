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

export type EffectBufferID = number

export type ReadModelInterop<TStore = any, TEvent extends Event = Event> = {
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
    store: TStore,
    effectBufferId?: EffectBufferID
  ) => Promise<ReadModelRuntimeEventHandler | null>
  acquireEventHandler: (
    store: TStore,
    event: TEvent,
    effectBufferId?: EffectBufferID
  ) => Promise<ReadModelRuntimeEventHandler | null>
  acquireChannel: () => Promise<ReadModelRuntimeChannel | null>
  beginEffects: () => Promise<EffectBufferID>
  commitEffects: (batchId: EffectBufferID) => Promise<void>
  dropEffects: (batchId: EffectBufferID) => Promise<void>
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
  name: string
  channel: string
  permit: string
}
