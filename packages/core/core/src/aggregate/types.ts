import type {
  CommandMiddleware,
  Eventstore,
  Monitoring,
  MiddlewareContext,
  StoredEventPointer,
} from '../types/runtime'
import type {
  Event,
  AggregateEncryptionFactory,
  AggregateProjection,
  Command,
  CommandHandler,
  SecretsManager,
  InteropCommandResult,
} from '../types/core'

export enum CommandHttpResponseMode {
  event = 'event',
  empty = 'empty',
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
  commandHttpResponseMode: CommandHttpResponseMode
}

export type AggregateInteropMap = {
  [key: string]: AggregateInterop
}

export type AggregatesInterop = {
  aggregateMap: AggregateInteropMap
  executeCommand: (
    command: Command,
    middlewareContext?: MiddlewareContext
  ) => Promise<InteropCommandResult>
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
    storedEvent: StoredEventPointer
  ) => Promise<void>
}

export type AggregateRuntime = {
  monitoring?: Monitoring
  secretsManager: SecretsManager
  eventstore: Eventstore
  hooks?: AggregateRuntimeHooks
  commandMiddlewares?: Array<CommandMiddleware>
}

export type AggregatesInteropBuilder = (
  runtime: AggregateRuntime
) => AggregatesInterop

export type AggregateDomain = {
  acquireAggregatesInterop: AggregatesInteropBuilder
}
