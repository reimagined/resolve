import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'
import type {
  CommandMiddleware,
  Domain,
  DomainMeta,
  Event,
  EventPointer,
  Monitoring,
  PerformanceTracer,
  ReadModelProjectionMiddleware,
  ReadModelResolverMiddleware,
} from '@resolve-js/core'
import type { CommandExecutor } from './command'
import type { IncomingHttpHeaders } from 'http'
import type { CookieSerializeOptions } from 'cookie'
import type { Params as MatchedParams } from 'route-trie'
import type { EventStoreAdapterFactory } from './create-runtime'
import type { Trie } from 'route-trie'
import type {
  CommonAdapterPool,
  AdapterOperations as ReadModelAdapterOperationsGeneric,
} from '@resolve-js/readmodel-base'

export type CallMethodParams = {
  modelName?: string | null
  eventSubscriber?: string | null
  [key: string]: any
}

export type EventSubscriber = {
  [key: string]: (params: CallMethodParams, ...args: any[]) => Promise<any>
}

export const readModelMethodNames = [
  'build',
  'reset',
  'resume',
  'pause',
  'subscribe',
  'resubscribe',
  'unsubscribe',
  'status',
] as const

export type ReadModelMethodName = typeof readModelMethodNames[number]

export type ReadModelAdapterOperations = ReadModelAdapterOperationsGeneric<CommonAdapterPool>

export type ReadModelConnector = {
  connect: (name: string) => Promise<any>
  disconnect: (connection: any, name: string) => Promise<void>
  dispose: () => Promise<void>

  drop: (connection: any, name: string) => Promise<void>
}

export type RealModelConnectorReal = ReadModelConnector &
  ReadModelAdapterOperations

export type ReadModelConnectorFactory = (options: {
  performanceTracer: PerformanceTracer
  monitoring?: Monitoring
}) => ReadModelConnector

export type QueryExecutor = {
  (...args: any[]): Promise<any>
  dispose: () => Promise<void>
  [key: string]: (...args: any[]) => Promise<any>
}

export type SagaExecutor = QueryExecutor & {
  build: (...args: any[]) => Promise<any>
}

export type ApiHandler = {
  path: string
  method: string
  handler: (req: ResolveRequest, res: ResolveResponse) => Promise<void>
}

type Middlewares = {
  command: CommandMiddleware[]
  resolver: ReadModelResolverMiddleware[]
  projection: ReadModelProjectionMiddleware[]
}
// TODO: include in DomainMeta and move to core!
export type DomainWithHandlers = DomainMeta & {
  apiHandlers: ApiHandler[]
  middlewares?: Middlewares
}

export type EventListener = {
  name: string
  eventTypes: string[]
  invariantHash?: string
  connectorName: string
  isSaga: boolean
}

export type SchedulerEntry = {
  taskId: string
  date: number | string | Date
  command: any
}

export type Scheduler = {
  addEntries: (array: SchedulerEntry[]) => Promise<void>
  clearEntries: () => Promise<void>
  executeEntries?: (entry: any) => any
}

export type UploaderPool = {
  [key: string]: any
}

export type Uploader = {
  getSignedPut: (
    dir: string
  ) => Promise<{ uploadUrl: string; uploadId: string }>
  getSignedPost: (dir: string) => Promise<{ form: any; uploadId: string }>
  uploadPut: (uploadUrl: string, filePath: string) => Promise<void>
  uploadPost: (form: { url: string }, filePath: string) => Promise<void>
  createToken: (options: { dir: string; expireTime: number }) => string

  //local
  directory?: string
  bucket?: any
  secretKey?: string

  //cloud
  getCDNUrl?: () => Promise<string>
}

export type Assemblies = {
  uploadAdapter: () => UploaderPool
  eventstoreAdapter: () => EventStoreAdapter
  readModelConnectors: Record<string, ReadModelConnectorFactory>

  //TODO: types
  seedClientEnvs: any
  serverImports: any
}

export type EventSubscriberNotification = {
  eventSubscriber: string
  initiator: 'read-model-next' | 'command-foreign' | 'command'
  notificationId: string
  sendTime: number
  event?: Event
  cursor?: string
}

export type InvokeBuildAsync = (
  parameters: EventSubscriberNotification
) => Promise<void>

export type BuildTimeConstants = {
  applicationName: string
  distDir: string
  jwtCookie: {
    name: string
    maxAge: number
  }
  host: string
  port: string
  rootPath: string
  staticDir: string
  staticPath: string
  staticRoutes?: string[] | undefined
}

export type EventSubscriberNotifier = (
  destination: string,
  eventSubscriber: string,
  event?: EventPointer
) => Promise<void>

export type ReactiveEventDispatcher = (
  event: Pick<Event, 'type' | 'aggregateId'>
) => Promise<void>

export type ReactiveSubscription = {
  appId: string
  url: string
}

export type ReactiveSubscriptionFactory = (
  origin: string,
  eventTypes: string[] | null,
  aggregateIds: string[] | null
) => Promise<ReactiveSubscription>

export type EventListeners = Map<string, EventListener>

export type HttpRequest = {
  readonly adapter: string
  readonly method: string
  readonly query: Record<string, any>
  readonly path: string
  readonly headers: IncomingHttpHeaders
  readonly cookies: Record<string, string>
  readonly body: string | null
  jwt?: string
  readonly isLambdaEdgeRequest?: boolean
  readonly clientIp?: string
}

export type ResolveRequest = HttpRequest & {
  readonly resolve: UserBackendResolve
  matchedParams: MatchedParams
}

export type HttpResponse = {
  readonly cookie: (
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly clearCookie: (
    name: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly status: (code: number) => HttpResponse
  readonly redirect: (path: string, code?: number) => HttpResponse
  readonly getHeader: (searchKey: string) => any
  readonly setHeader: (key: string, value: string) => HttpResponse
  readonly text: (content: string, encoding?: BufferEncoding) => HttpResponse
  readonly json: (content: any) => HttpResponse
  readonly end: (
    content?: string | Buffer,
    encoding?: BufferEncoding
  ) => HttpResponse
  readonly file: (
    content: string | Buffer,
    filename: string,
    encoding?: BufferEncoding
  ) => HttpResponse
}

export type ResolveResponse = HttpResponse

export type EventListenersManagerParameters = {
  upstream: boolean
  eventSubscriberScope: string
  getEventSubscriberDestination: (name: string) => string
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
}

export type RuntimeFactoryParameters = {
  readonly seedClientEnvs: Assemblies['seedClientEnvs']
  readonly serverImports: Assemblies['serverImports']
  readonly domain: DomainWithHandlers
  readonly domainInterop: Domain
  readonly performanceTracer: PerformanceTracer
  readonly monitoring: Monitoring
  readonly eventStoreAdapterFactory: EventStoreAdapterFactory
  readonly readModelConnectorsFactories: Record<
    string,
    ReadModelConnectorFactory
  >
  readonly getVacantTimeInMillis: () => number
  readonly eventSubscriberScope: string
  readonly notifyEventSubscriber: EventSubscriberNotifier
  readonly invokeBuildAsync: InvokeBuildAsync
  readonly eventListeners: EventListeners
  readonly sendReactiveEvent: ReactiveEventDispatcher
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  readonly uploader: Uploader | null
  scheduler?: Scheduler
} & EventListenersManagerParameters

export type EventListenersManager = {
  readonly bootstrapAll: (waitForReady: boolean) => Promise<void>
  readonly shutdownAll: (soft: boolean) => Promise<void>
}

export type Runtime = {
  readonly eventStoreAdapter: EventStoreAdapter
  readonly uploader: Uploader | null
  readonly executeCommand: CommandExecutor
  readonly executeQuery: QueryExecutor
  readonly executeSaga: SagaExecutor
  readonly eventSubscriber: EventSubscriber
  readonly executeSchedulerCommand: CommandExecutor
  readonly readModelConnectors: Record<string, ReadModelConnector>
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  readonly eventListenersManager: EventListenersManager
  readonly dispose: () => Promise<void>
}

export type PublicRuntime = Omit<Runtime, 'dispose' | 'readModelConnectors'>

export type UserBackendDependencies = {
  // TODO: this is correct way to expose runtime to user
  runtime: PublicRuntime
  seedClientEnvs: RuntimeFactoryParameters['seedClientEnvs']
  // TODO: excessive internal data access
  routesTrie: Trie
  domain: RuntimeFactoryParameters['domain']
  domainInterop: RuntimeFactoryParameters['domainInterop']
  eventSubscriberScope: RuntimeFactoryParameters['eventSubscriberScope']
  // TODO: push to runtime interface?
  performanceTracer: PerformanceTracer
  eventListeners: RuntimeFactoryParameters['eventListeners']
}

export type UserBackendResolve = Readonly<
  Omit<Runtime, 'eventStoreAdapter'> &
    BuildTimeConstants &
    UserBackendDependencies & {
      eventstoreAdapter: EventStoreAdapter
    }
>

export type RuntimeEntryContext = {
  assemblies: Assemblies
  constants: BuildTimeConstants
  domain: DomainWithHandlers
  resolveVersion: string
}

export type RuntimeWorker<TArgs extends any[] = any[]> = (
  ...args: TArgs
) => Promise<void>
export type RuntimeModule<TWorkerArgs extends any[] = any[]> = {
  entry: (context: RuntimeEntryContext) => Promise<RuntimeWorker<TWorkerArgs>>
  execMode: 'immediate' | 'external'
}
export type RuntimeModuleFactory<
  TOptions,
  TWorkerArgs extends any[] = any[]
> = (options: TOptions) => RuntimeModule<TWorkerArgs>
