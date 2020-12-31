import { Decrypter, Encrypter, Event, SecretsManager } from 'resolve-core'

export type ReadModelEventHandlerContext = {
  encrypt: Encrypter | null
  decrypt: Decrypter | null
}

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

export type ReadModelRuntimeEventHandler = (
  connection: any,
  event: Event
) => Promise<void>

export type ReadModelEventHandler = (
  connection: any,
  event: Event,
  context: ReadModelEventHandlerContext
) => Promise<void>

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

export type ReadModelRuntime = {
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
  //acquireEventHandler: (event: any) => ReadModelRuntimeEventHandler
}

export type ReadModelInteropMap = {
  [key: string]: ReadModelInterop
}

export type ReadModelsInteropBuilder = (
  runtime: ReadModelRuntime
) => ReadModelInteropMap

// FIXME: replace create with get?
export type ReadModelDomain = {
  acquireReadModelsInterop: ReadModelsInteropBuilder
}

