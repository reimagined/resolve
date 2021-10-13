import { lambdaWorker } from './lambda-worker'
import type {
  EventSubscriberNotification,
  EventSubscriberNotifier,
} from '@resolve-js/runtime-base'
import type { Trie } from 'route-trie'
import type { PerformanceTracer, Domain } from '@resolve-js/core'
import type {
  Assemblies,
  BuildTimeConstants,
  ReactiveSubscriptionFactory,
  Runtime,
  RuntimeFactoryParameters,
} from '@resolve-js/runtime-base'

export type OmitFirstParameter<F> = F extends (
  x: any,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never

export type EventSubscriberInterface = {
  notifyEventSubscriber: EventSubscriberNotifier
  invokeBuildAsync: (params: EventSubscriberNotification) => Promise<void>
  getEventSubscriberDestination: (name: string) => string
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
}

export type LambdaColdStartContext = {
  readonly performanceTracer: PerformanceTracer
  readonly seedClientEnvs: RuntimeFactoryParameters['seedClientEnvs']
  readonly serverImports: RuntimeFactoryParameters['serverImports']
  readonly constants: BuildTimeConstants
  // TODO: why we still need domain meta outside core?
  readonly domain: RuntimeFactoryParameters['domain']
  readonly domainInterop: Domain
  readonly eventListeners: RuntimeFactoryParameters['eventListeners']
  readonly eventSubscriberScope: string
  readonly upstream: boolean
  readonly resolveVersion: string
  readonly routesTrie: Trie
  readonly uploader: Runtime['uploader']
  readonly sendReactiveEvent: RuntimeFactoryParameters['sendReactiveEvent']
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  // TODO: do we really need this somewhere?
  readonly assemblies: Assemblies
}

export type LambdaEventRecord = {
  eventSource: string | null
  body: string
}

export type LambdaContext = {
  invokedFunctionArn: string
  functionName: string
  getRemainingTimeInMillis: () => number
  callbackWaitsForEmptyEventLoop: boolean

  Records: Array<LambdaEventRecord | null>
}

type LambdaEventBase = {
  Records?: LambdaEventRecord
  httpMethod?: string
  headers?: { [key: string]: string }
  requestStartTime?: number
}
export type BuildEventSubscriberLambdaEvent = {
  readonly resolveSource: 'BuildEventSubscriber'
  readonly eventSubscriber: string
} & LambdaEventBase
export type SchedulerLambdaEvent = {
  readonly resolveSource: 'Scheduler'
} & LambdaEventBase
export type WebsocketLambdaEvent = {
  readonly resolveSource: 'Websocket'
} & LambdaEventBase
export type CloudServiceLambdaEvent = {
  readonly resolveSource: 'DeployService'
  readonly part: 'bootstrap' | 'shutdown' | 'readModel' | 'saga'
  readonly operation: string
  // TODO: bad naming
  readonly soft: boolean
} & LambdaEventBase
export type ApiGatewayLambdaEvent = {
  readonly resolveSource: 'None'
  readonly path: string
  readonly multiValueQueryStringParameters?: { [key: string]: string }
  readonly body?: string | null
} & LambdaEventBase
export type LambdaEvent =
  | BuildEventSubscriberLambdaEvent
  | SchedulerLambdaEvent
  | WebsocketLambdaEvent
  | CloudServiceLambdaEvent
  | ApiGatewayLambdaEvent

export type RuntimeOptions = {}

export type WorkerArguments = Parameters<
  OmitFirstParameter<typeof lambdaWorker>
>
export type WorkerResult = {
  statusCode?: number
  headers?: { [key: string]: string }
  body?: string
}
