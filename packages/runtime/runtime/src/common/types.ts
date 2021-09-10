import type { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import type {
  PerformanceTracer,
  Domain,
  DomainMeta,
  Event,
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
import type { Trie } from 'route-trie'

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
}

export type UploaderPool = {
  directory: string
  secretKey: string
  bucket: any
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
  directory: UploaderPool['directory']
  bucket: UploaderPool['bucket']
  secretKey: UploaderPool['secretKey']
}

export type Assemblies = {
  uploadAdapter: () => UploaderPool
  eventstoreAdapter: () => EventstoreAdapter
  readModelConnectors: any

  //TODO: types
  seedClientEnvs: any
  serverImports: any
}

export type BuildParameters = {
  eventSubscriber: string
  initiator: 'read-model-next' | 'command-foreign' | 'command'
  notificationId: string
  sendTime: number
  event?: Event
  cursor?: string
}

export type BuildTimeConstants = {
  applicationName: string
  distDir: string
  jwtCookie: {
    name: string
    maxAge: number
  }
  port: string
  rootPath: string
  staticDir: string
  staticPath: string
}

export type Resolve = {
  isInitialized: boolean

  instanceId: string

  seedClientEnvs: Assemblies['seedClientEnvs']
  serverImports: Assemblies['serverImports']

  eventListeners: Map<string, EventListener>
  upstream: boolean

  http: typeof http
  https: typeof https

  getEventSubscriberDestination: (name?: string) => string
  invokeBuildAsync: (parameters: BuildParameters) => Promise<void>
  invokeLambdaAsync: any

  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>

  eventstoreAdapter: EventstoreAdapter
  readModelConnectors: any
  readModelSources: any

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

  //TODO: types
  executeQuery: any
  executeSaga: any

  eventSubscriber: any
  eventSubscriberScope: string

  executeCommand: CommandExecutor
  executeSchedulerCommand: CommandExecutor

  notifyEventSubscribers: (eventWithCursor?: {
    event: Event
    cursor: string
  }) => Promise<void>

  //TODO: types
  sendSqsMessage: Function

  monitoring: Monitoring

  staticRoutes?: string[]

  routesTrie: Trie

  getVacantTimeInMillis: () => number
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
}

export type ResolveRequest = HttpRequest & {
  readonly resolve: Resolve
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
