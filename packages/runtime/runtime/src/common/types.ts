import type { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import type {
  PerformanceTracer,
  Domain,
  DomainMeta,
  Event,
} from '@resolve-js/core'
import type { Server as HttpServer } from 'http'
import http from 'http'
import https from 'https'

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
  }): void
  dispatch(options: {
    event: Pick<Event, 'type' | 'aggregateId'>
    topicName: string
    topicId: string
  }): Promise<void>
}

export type ScheduleEntry = {
  taskId: string
  date: number | string | Date
  command: any
}

export type Scheduler = {
  addEntries: (array: ScheduleEntry[]) => Promise<void>
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
  eventstoreAdapter: () => Promise<EventstoreAdapter>

  //TODO: types
  seedClientEnvs: any
  serverImports: any
}

export type Resolve = {
  instanceId: string

  seedClientEnvs: Assemblies['seedClientEnvs']
  serverImports: Assemblies['serverImports']

  eventListeners: any
  upstream: any

  http: typeof http
  https: typeof https

  getEventSubscriberDestination: () => string
  invokeBuildAsync: Function

  ensureQueue: () => Promise<void>
  deleteQueue: () => Promise<void>

  eventstoreAdapter: EventstoreAdapter
  applicationName: string
  assemblies: Assemblies
  domain: DomainMeta
  domainInterop: Domain
  rootPath: string
  performanceTracer: PerformanceTracer
  pubsubManager: PubsubManager
  scheduler: Scheduler
  uploader: Uploader

  sendReactiveEvent: (
    event: Pick<Event, 'type' | 'aggregateId'>
  ) => Promise<void>
  getSubscribeAdapterOptions: (
    origin: string,
    eventTypes: string[] | null,
    aggregateIds: string[] | null
  ) => { appId: Resolve['applicationName']; url: string }

  websocketHttpServer: HttpServer

  //TODO: types
  eventSubscriber: any
  eventSubscriberScope: any
}

export type ResolvePartial = Partial<Resolve>

export type ResolveRequest = {
  resolve: Resolve
}

export type ResolveResponse = {
  end: (text: string) => void
  status: (status: number) => void
}
