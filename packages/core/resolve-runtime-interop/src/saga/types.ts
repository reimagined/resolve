import { SecretsManager, Event } from 'resolve-core'
import { AggregateMeta } from '../types'

export type SchedulerInfo = {
  name: string
  connectorName: string
}

export type SagaProperties = {
  [key: string]: string
}

export type SideEffectsCollection = {
  [key: string]: Function | SideEffectsCollection
}

export type SchedulerRuntime = {
  addEntries: Function
  clearEntries: Function
  executeEntries: Function
}
export type SchedulerSideEffects = SchedulerRuntime

export type SystemSideEffects = {
  executeCommand: Function
  executeQuery: Function
  scheduleCommand: Function
  secretsManager: SecretsManager
  uploader: any
}

export type SagaRuntime = {
  eventProperties: SagaProperties
  executeCommand: Function
  executeQuery: Function
  getSecretsManager: () => Promise<SecretsManager>
  uploader: any
  scheduler: SchedulerRuntime
}

export type SchedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: string
  SCHEDULED_COMMAND_EXECUTED: string
  SCHEDULED_COMMAND_SUCCEEDED: string
  SCHEDULED_COMMAND_FAILED: string
}

export type SchedulerAggregateBuilder = () => AggregateMeta

export type SchedulersSagasBuilder = (
  domain: {
    schedulersInfo: SchedulerInfo[]
    schedulerName: string
    schedulerEventTypes: SchedulerEventTypes
  },
  runtime: SagaRuntime
) => any[]

export type ApplicationSagasBuilder = (
  domain: {
    schedulerName: string
    sagas: any[]
  },
  runtime: SagaRuntime
) => any[]

export type SagaDomain = {
  schedulerName: string
  schedulerEventTypes: { [key: string]: string }
  schedulerInvariantHash: string
  getSagasSchedulersInfo: () => SchedulerInfo[]
  createSchedulerAggregate: SchedulerAggregateBuilder
  createSagas: (runtime: SagaRuntime) => any[]
}

export type SagaEventHandler<TSideEffects extends SideEffectsCollection> = (
  context: {
    store: any
    sideEffects: TSideEffects
  },
  event: Event
) => Promise<void>

export type SagaHandlers<TSideEffects extends SideEffectsCollection> = {
  [key: string]: SagaEventHandler<TSideEffects>
}
