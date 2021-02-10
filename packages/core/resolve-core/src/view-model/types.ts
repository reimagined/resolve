import { SecretsManager, Event } from '../core-types'
import { ViewModelSerializer } from '../types'

export type Eventstore = {
  getNextCursor: (cursor: any, events: Event[]) => Promise<any>
  saveSnapshot: Function
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  loadEvents: (param: {
    aggregateIds: string[]
    eventTypes: string[]
    cursor: null
    limit: number
  }) => Promise<{
    events: any[]
  }>
}

export type Monitoring = {
  error?: (error: Error, part: string, meta: any) => Promise<void>
  performance?: PerformanceTracer
}

export type PerformanceSubsegment = {
  addAnnotation: (name: string, data: any) => void
  addError: (error: Error) => void
  close: () => void
}
export type PerformanceSegment = {
  addNewSubsegment: (name: string) => PerformanceSubsegment
}

export type PerformanceTracer = {
  getSegment: () => PerformanceSegment
}

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
  cursor: any
}

export type ViewModelRuntime = {
  monitoring: Monitoring
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
