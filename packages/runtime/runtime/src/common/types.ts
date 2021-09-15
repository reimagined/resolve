import type { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import type {
  PerformanceTracer,
  Domain,
  DomainMeta,
  Event,
  EventWithCursor,
  Monitoring,
  CommandMiddleware,
  ReadModelResolverMiddleware,
  ReadModelProjectionMiddleware,
} from '@resolve-js/core'
import type { CommandExecutor } from './command'
import type { Server as HttpServer, IncomingHttpHeaders } from 'http'
import http from 'http'
import https from 'https'
import type { CookieSerializeOptions } from 'cookie'
import type { Trie, Params as MatchedParams } from 'route-trie'

export type CallMethodParams = {
  modelName?: string | null
  eventSubscriber?: string | null
  [key: string]: any
}

export type EventSubscriber = {
  [key: string]: (params: CallMethodParams, ...args: any[]) => Promise<any>
}

export type ReadModelMethodName =
  | 'build'
  | 'reset'
  | 'resume'
  | 'pause'
  | 'subscribe'
  | 'resubscribe'
  | 'unsubscribe'
  | 'status'

export type ReadModelConnector = {
  connect: (name: string) => Promise<any>
  disconnect: (connection: any, name: string) => Promise<void>
  dispose: () => Promise<void>

  drop: (connection: any, name: string) => Promise<void>
} & Record<ReadModelMethodName, (...parameters: any[]) => Promise<void>>

export type ReadModelConnectorFactory = (options: {
  performanceTracer: PerformanceTracer
  monitoring: Monitoring
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

type DomainWithHandlers = DomainMeta & {
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

export type PubsubConnectionOptions = {
  client: (event: string) => Promise<void>
  connectionId: string
  eventTypes?: string[] | null
  aggregateIds?: string[] | null
}

export type PubsubConnection = {
  client: PubsubConnectionOptions['client']
  eventTypes?: PubsubConnectionOptions['eventTypes']
  aggregateIds?: PubsubConnectionOptions['aggregateIds']
}

export type PubsubManager = {
  connect(options: PubsubConnectionOptions): void
  disconnect(options: {
    connectionId: PubsubConnectionOptions['connectionId']
  }): void
  getConnection(options: {
    connectionId: PubsubConnectionOptions['connectionId']
  }): PubsubConnection | undefined
  dispatch(options: {
    event: Pick<Event, 'type' | 'aggregateId'>
    topicName: string
    topicId: string
  }): Promise<void>
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
  eventstoreAdapter: () => EventstoreAdapter
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

export type InvokeBuildAsync = (parameters: EventSubscriberNotification) => Promise<void>

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
  event?: EventWithCursor
) => Promise<void>

export type Resolve = {
  isInitialized: boolean

  instanceId?: string

  seedClientEnvs: Assemblies['seedClientEnvs']
  serverImports: Assemblies['serverImports']

  eventListeners: Map<string, EventListener>
  upstream: boolean

  getEventSubscriberDestination: (name?: string) => string
  invokeBuildAsync: InvokeBuildAsync

  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>

  eventstoreAdapter: EventstoreAdapter
  readModelConnectors: Record<string, ReadModelConnector>
  readModelSources: Record<string, string | null>

  assemblies: Assemblies
  domain: DomainWithHandlers
  domainInterop: Domain
  readonly performanceTracer: PerformanceTracer
  pubsubManager: PubsubManager
  scheduler: Scheduler
  uploader: Uploader

  sendReactiveEvent: (
    event: Pick<Event, 'type' | 'aggregateId'>
  ) => Promise<void>
  //TODO: bind to resolve object?
  getSubscribeAdapterOptions: (
    resolve: Resolve,
    origin: string,
    eventTypes: string[] | null,
    aggregateIds: string[] | null
  ) => Promise<{ appId: Resolve['applicationName']; url: string }>

  websocketHttpServer: HttpServer
  server: http.Server

  executeQuery: QueryExecutor
  executeSaga: SagaExecutor

  eventSubscriber: EventSubscriber
  eventSubscriberScope: string

  executeCommand: CommandExecutor
  executeSchedulerCommand: CommandExecutor

  notifyEventSubscribers: (eventWithCursor?: {
    event: Event
    cursor: string
  }) => Promise<void>

  notifyEventSubscriber: EventSubscriberNotifier

  //TODO: types
  monitoring: Monitoring

  routesTrie: Trie

  getVacantTimeInMillis: () => number

  resolveVersion?: string
  subscriptionsCredentials: {
    applicationLambdaArn: string
  }
  publisher: any
} & BuildTimeConstants

export type ResolvePartial = Partial<Resolve>

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
  readonly resolve: Resolve
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
