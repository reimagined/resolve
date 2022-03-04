import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'
import type {
  Domain,
  DomainMeta,
  Event,
  EventPointer,
  Monitoring,
  MonitoringAdapter,
  PerformanceTracer,
  Uploader as PublicUploader,
  BuildTimeConstants,
  HttpRequest,
  ResolveRequest as PublicResolveRequest,
  HttpResponse,
  ResolveResponse,
  ReadModelInteropMap,
  ViewModelInteropMap,
  SagaInteropMap,
  ReadModelInterop,
  ViewModelInterop,
  SagaInterop,
  MiddlewareContext,
  Eventstore,
} from '@resolve-js/core'
import type { CommandExecutor } from './command'
import type { Params as MatchedParams } from 'route-trie'
import type { EventStoreAdapterFactory } from './create-runtime'
import type { Trie } from 'route-trie'
import type {
  ObjectFixedIntersectionToObject,
  BuildDirectContinuation,
  CommonAdapterPool,
  CommonAdapterOptions,
  ReadModelStoreImpl,
  AdapterApi,
  UnPromise,
  FunctionLike,
  IfEquals,
} from '@resolve-js/readmodel-base'
export type {
  ObjectFixedIntersectionToObject,
  BuildDirectContinuation,
  ReadModelInteropMap,
  SagaInteropMap,
  ViewModelInteropMap,
  ReadModelStoreImpl,
  CommonAdapterPool,
  ReadModelInterop,
  ViewModelInterop,
  SagaInterop,
  MiddlewareContext,
  Eventstore,
  FunctionLike,
  UnPromise,
  IfEquals,
}

export type EventSubscriberRuntime = {
  setCurrentEventSubscriber: (readModelName: string) => void
  loadReadModelProcedure: (readModelName: string) => Promise<string | null>
  readModelConnectors: Record<string, UnknownReadModelConnector>
  getEventSubscriberDestination: Function
  applicationName: string
  getVacantTimeInMillis: () => number
  eventstoreAdapter: Eventstore
  readModelsInterop: ReadModelInteropMap
  sagasInterop: SagaInteropMap
  performanceTracer: any
  monitoring: any
}

export type ExecuteQueryPool = {
  readModelConnectors: Record<string, UnknownReadModelConnector>
  readModelsInterop: ReadModelInteropMap | SagaInteropMap
  viewModelsInterop: ViewModelInteropMap
  eventSubscriber: EventSubscriber
  performanceTracer: any
  monitoring: any
}

export type RegularReadModelConnector = AdapterApi<CommonAdapterPool>

export enum CustomReadModelConnectionBrand {
  _ = '',
}
export type CustomReadModelConnection = {} & CustomReadModelConnectionBrand
export type IsCustomReadModelConnection<
  T
> = T extends CustomReadModelConnectionBrand ? unknown : never

export type CustomReadModelConnector = {
  connect: (name: string) => Promise<CustomReadModelConnection>
  disconnect: (
    connection: CustomReadModelConnection,
    name: string
  ) => Promise<void>
  dispose: () => Promise<void>
  drop: (connection: CustomReadModelConnection, name: string) => Promise<void>
}

export type UnknownReadModelConnector =
  | RegularReadModelConnector
  | CustomReadModelConnector

export type RegularReadModelConnection = UnPromise<
  ReturnType<RegularReadModelConnector['connect']>
>

export type UnknownReadModelConnection =
  | RegularReadModelConnection
  | CustomReadModelConnection

export type OmitRegularReadModelArgs<T extends [any, any, ...any[]]> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends [infer _, infer __, ...infer U] ? U : never

export type ExtractTupleUnionImplDistribute<
  T extends any[],
  N extends never[]
> = T extends any ? T[N['length']] : never
export type ExtractTupleUnionImpl<
  T extends any[],
  N extends never[],
  R extends any[],
  E = ExtractTupleUnionImplDistribute<T, N>
> = [E] extends [never]
  ? never
  : [E] extends [undefined]
  ? R
  : ExtractTupleUnionImpl<
      T,
      [...N, never],
      [Extract<E, undefined>] extends [never] ? [...R, E] : [...R, E?]
    >
export type ExtractTupleUnion<T extends any[]> = ExtractTupleUnionImpl<
  T,
  [],
  []
>

export type UnionMethodToUnionArgsMethodArgs<
  T extends FunctionLike
> = ExtractTupleUnion<T extends any ? Parameters<T> : never>
export type UnionMethodToUnionArgsMethodResult<
  T extends FunctionLike
> = T extends any ? ReturnType<T> : never
export type UnionMethodToUnionArgsMethodImpl<T extends [FunctionLike]> = (
  ...args: UnionMethodToUnionArgsMethodArgs<T[0]>
) => UnionMethodToUnionArgsMethodResult<T[0]>
export type UnionMethodToUnionArgsMethod<
  T extends FunctionLike
> = UnionMethodToUnionArgsMethodImpl<[T]>

export type RegularReadModelConnectorOperations = Omit<
  RegularReadModelConnector,
  'connect' | 'disconnect' | 'dispose'
>

export type EventSubscriberModelNamePart = {
  eventSubscriber?: string | null | undefined
  modelName?: string | null | undefined
}

export type EventSubscriber = {
  deleteProperty: (
    params: EventSubscriberModelNamePart & {
      key: string
    }
  ) => Promise<void>
  listProperties: (params: EventSubscriberModelNamePart) => Promise<any>
  getProperty: (
    params: EventSubscriberModelNamePart & {
      key: string
    }
  ) => Promise<any>
  setProperty: (
    params: EventSubscriberModelNamePart & {
      key: string
      value: any
    }
  ) => Promise<void>
  subscribe: (
    params: EventSubscriberModelNamePart & {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => Promise<void>
  resubscribe: (
    params: EventSubscriberModelNamePart & {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => Promise<void>
  unsubscribe: (params: EventSubscriberModelNamePart) => Promise<void>
  build: (
    params: EventSubscriberModelNamePart & {
      initiator: any
      notificationId: any
      sendTime: any
    }
  ) => Promise<BuildDirectContinuation>
  resume: (
    params: EventSubscriberModelNamePart
  ) => Promise<BuildDirectContinuation>
  pause: (params: EventSubscriberModelNamePart) => Promise<void>
  reset: (params: EventSubscriberModelNamePart) => Promise<void>
  status: (
    params: EventSubscriberModelNamePart & {
      includeRuntimeStatus?: boolean | undefined
      retryTimeoutForRuntimeStatus?: number | undefined
    }
  ) => Promise<any>
}

export type ReadModelConnectorFactory = (
  options: CommonAdapterOptions
) => UnknownReadModelConnector

export type QueryExecutor = {
  (
    params: EventSubscriberModelNamePart & Record<string, any>,
    middlewareContext?: MiddlewareContext | undefined
  ): Promise<any>
  read: (
    params: EventSubscriberModelNamePart & Record<string, any>,
    middlewareContext?: MiddlewareContext | undefined
  ) => Promise<any>
  serializeState: (
    params: EventSubscriberModelNamePart & Record<string, any>
  ) => Promise<string | undefined>
} & EventSubscriber

export type SagaExecutor = QueryExecutor

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

export type Uploader = PublicUploader & {
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
  monitoringAdapters: Record<string, () => MonitoringAdapter>
  serverImports: { [key: string]: any }

  //TODO: types
  seedClientEnvs: any
}

export type EventSubscriberNotification = {
  eventSubscriber: string
  initiator: 'read-model-next' | 'command-foreign' | 'command'
  notificationId: string
  sendTime: number
  event?: Event
  cursor?: string
  [key: string]: any
}

export type InvokeBuildAsync = (
  parameters: EventSubscriberNotification,
  timeout?: number
) => Promise<void>

export type { BuildTimeConstants }

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

export type { HttpRequest, HttpResponse, ResolveResponse }

export type ResolveRequest = Omit<PublicResolveRequest, 'resolve'> & {
  readonly resolve: UserBackendResolve
  matchedParams: MatchedParams
}

export type EventListenersManagerParameters = {
  upstream: boolean
  eventSubscriberScope: string
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
}

export type RuntimeFactoryParameters = {
  readonly seedClientEnvs: Assemblies['seedClientEnvs']
  readonly serverImports: Assemblies['serverImports']
  readonly monitoring: Monitoring
  readonly domain: DomainMeta
  readonly domainInterop: Domain
  readonly performanceTracer: PerformanceTracer
  readonly eventStoreAdapterFactory: EventStoreAdapterFactory
  readonly getEventSubscriberDestination: (name: string) => string
  readonly readModelConnectorsFactories: Record<
    string,
    ReadModelConnectorFactory
  >
  readonly getVacantTimeInMillis: (
    getRuntimeCreationTime: () => number
  ) => number
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
  readonly readModelConnectors: Record<string, UnknownReadModelConnector>
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  readonly eventListenersManager: EventListenersManager
  readonly dispose: () => Promise<void>
  readonly broadcastEvent: (event?: EventPointer) => Promise<void>
  readonly monitoring: Monitoring
  readonly serverImports: Assemblies['serverImports']
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
  domain: DomainMeta
  resolveVersion: string
}

export type RuntimeWorker<TArgs extends any[], TResult = never> = (
  ...args: TArgs
) => Promise<TResult>
export type RuntimeModule<TWorkerArgs extends any[], TWorkerResult = never> = {
  entry: (
    context: RuntimeEntryContext
  ) => Promise<RuntimeWorker<TWorkerArgs, TWorkerResult>>
  execMode: 'immediate' | 'external'
}
export type RuntimeModuleFactory<
  TOptions,
  TWorkerArgs extends any[],
  TWorkerResult = never
> = (options: TOptions) => RuntimeModule<TWorkerArgs, TWorkerResult>
