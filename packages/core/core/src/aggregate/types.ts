import { Eventstore, Monitoring } from '../types/runtime'
import {
  Event,
  AggregateEncryptionFactory,
  AggregateProjection,
  Command,
  CommandHandler,
  CommandResult,
  SecretsManager,
} from '../types/core'

export type AggregateInterop = {
  name: string
  commands: {
    [key: string]: CommandHandler
  }
  encryption: AggregateEncryptionFactory | null
  projection: AggregateProjection
  serializeState: Function
  deserializeState: Function
  invariantHash?: string
}

export type AggregateInteropMap = {
  [key: string]: AggregateInterop
}

export type AggregatesInterop = {
  aggregateMap: AggregateInteropMap
  executeCommand: (command: Command) => Promise<CommandResult>
}

export type AggregateRuntimeHooks = {
  preSaveEvent?: (
    aggregate: AggregateInterop,
    command: Command,
    event: Event
  ) => Promise<boolean>
  postSaveEvent?: (
    aggregate: AggregateInterop,
    command: Command,
    event: Event
  ) => Promise<void>
}

export type AggregateRuntime = {
  monitoring: Monitoring
  secretsManager: SecretsManager
  eventstore: Eventstore
  hooks?: AggregateRuntimeHooks
}

export type AggregatesInteropBuilder = (
  runtime: AggregateRuntime
) => AggregatesInterop

export type AggregateDomain = {
  acquireAggregatesInterop: AggregatesInteropBuilder
}
