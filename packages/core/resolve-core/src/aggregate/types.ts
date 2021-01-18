import { Monitoring } from '../types'
import {
  Event,
  AggregateEncryptionFactory,
  AggregateProjection,
  Command,
  CommandHandler,
  CommandResult,
  SecretsManager,
} from '../core-types'

export type Eventstore = {
  saveEvent: (event: any) => Promise<void>
  getNextCursor: Function
  saveSnapshot: Function
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  loadEvents: (param: {
    aggregateIds: string[]
    cursor: null
    limit: number
  }) => Promise<{
    events: any[]
  }>
}

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

// FIXME: replace create with get?
export type AggregateDomain = {
  acquireAggregatesInterop: AggregatesInteropBuilder
}
