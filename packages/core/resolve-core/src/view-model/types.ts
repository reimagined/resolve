import { SecretsManager, Event } from '../core-types'

export type ViewModelRuntimeResolver = (
  connection: any,
  secretsManager: SecretsManager | null
) => Promise<any>

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

export type ViewModelRuntime = {
  monitoring: Monitoring
}

export type ViewModelInterop = {
  name: string
  acquireResolver: (
    resolver: string,
    args: any,
    context: {
      jwt?: string
    }
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
