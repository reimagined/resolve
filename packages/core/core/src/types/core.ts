// Primitives

export type SerializablePrimitive = string | number | boolean | null

export type SerializableMap = {
  [key: string]: Serializable
}

export type SerializableArray = Array<Serializable>

export type Serializable =
  | SerializablePrimitive
  | SerializableMap
  | SerializableArray

// Common

export type Event = {
  type: string
  timestamp: number
  aggregateId: string
  aggregateVersion: number
  payload?: any
}

export type Serializer<T> = (data: T) => string

export type Deserializer<T> = (blob: string) => T

// Encryption

export type PlainData = Serializable

export type EncryptedBlob = string

export type SecretsManager = {
  getSecret: (id: string) => Promise<string | null>
  setSecret: (id: string, secret: string) => Promise<void>
  deleteSecret: (id: string) => Promise<boolean>
}

export type Encrypter = (data: PlainData) => EncryptedBlob

export type Decrypter = (blob: EncryptedBlob) => PlainData

export type Encryption = {
  encrypt?: Encrypter
  decrypt?: Decrypter
}

// TODO: move types from @resolve-js/client here?

export type ReadModelQuery = {
  modelName: string
  resolverName: string
  resolverArgs: Serializable
  jwt?: string
  jwtToken?: string
}

export type ReadModelQueryResult = Serializable

export type ViewModelQuery = {
  modelName: string
  aggregateIds: Array<string> | '*'
  aggregateArgs: Serializable
}

export type ViewModelQueryResult = Serializable

export type Command = {
  type: string
  aggregateId: string
  aggregateName: string
  payload?: any
  jwt?: string
  jwtToken?: string // deprecated
}

export type CommandResult = {
  type: string
  payload?: any
  timestamp?: number
  aggregateId?: string
  aggregateVersion?: number
}

// Aggregate

export type AggregateState = any

export type AggregateEventHandler = (
  state: AggregateState,
  event: Event
) => AggregateState

export type CommandContext = {
  jwt?: string
  aggregateVersion: number
} & Encryption

export type AggregateProjection = {
  Init?: () => AggregateState
} & {
  [key: string]: AggregateEventHandler
}

export type CommandHandler<TContext extends CommandContext = CommandContext> = (
  state: AggregateState,
  command: Command,
  context: TContext
) => CommandResult | Promise<CommandResult>

export type Aggregate<TContext extends CommandContext = CommandContext> = {
  [key: string]: CommandHandler<TContext>
}

export type AggregateEncryptionContext = {
  jwt?: string
  secretsManager: SecretsManager
}

export type AggregateEncryptionFactory = (
  aggregateId: string,
  context: AggregateEncryptionContext
) => Promise<Encryption | null>

// Read model

export type ReadModelHandlerContext = Encryption

type ReadModelInitHandler<TStore> = (store: TStore) => Promise<void>

export type ReadModelEventHandler<
  TStore,
  TContext extends ReadModelHandlerContext = ReadModelHandlerContext
> = (store: TStore, event: Event, context: TContext) => Promise<void>

export type ReadModel<
  TStore,
  TContext extends ReadModelHandlerContext = ReadModelHandlerContext
> = {
  [key: string]: ReadModelEventHandler<TStore, TContext>
} & {
  Init?: ReadModelInitHandler<TStore>
}

export type ReadModelResolverContext = {
  jwt?: string
  secretsManager: SecretsManager | null
}

export type ReadModelResolver<
  TStore,
  TContext extends ReadModelResolverContext = ReadModelResolverContext
> = (store: TStore, params: SerializableMap, context: TContext) => Promise<any>

export type ReadModelResolvers<
  TStore,
  TContext extends ReadModelResolverContext = ReadModelResolverContext
> = {
  [key: string]: ReadModelResolver<TStore, TContext>
}

export type EventHandlerEncryptionContext = {
  secretsManager: SecretsManager
}

export type EventHandlerEncryptionFactory = (
  event: Event,
  context: EventHandlerEncryptionContext
) => Promise<Encryption | null>

// View model
export type ViewModelHandlerContext = {
  jwt?: string
} & Encryption

export type ViewModelInitHandler<TState> = () => TState

export type ViewModelEventHandler<TState> = (
  state: TState,
  event: Event,
  args: any,
  context: ViewModelHandlerContext
) => TState

export type ViewModelProjection<TState> = {
  Init: ViewModelInitHandler<TState>
} & {
  [key: string]: ViewModelEventHandler<TState>
}

type ViewModelResolverApi = {
  buildViewModel: Function
}

type ViewModelResolverContext = {
  jwt?: string
  viewModel: {
    name: string
    eventTypes: string[]
  }
}

export type ViewModelResolverQuery = {
  aggregateIds: string[]
  aggregateArgs: any
}

export type ViewModelResolver = (
  api: ViewModelResolverApi,
  query: ViewModelResolverQuery,
  context: ViewModelResolverContext
) => Promise<any>

export type ViewModelResolverMap = {
  [key: string]: ViewModelResolver
}

// Saga

export type SagaSideEffects = {
  executeCommand: (command: Command) => Promise<CommandResult>
  executeQuery: (query: ReadModelQuery | ViewModelQuery) => Promise<any>
  scheduleCommand: (timestamp: number, command: Command) => Promise<void>
  secretsManager: SecretsManager
  isEnabled: boolean
  uploader: any
}

export type SideEffectsCollection = {
  [key: string]: Function | SideEffectsCollection
}

export type SagaContext<TStore, TSideEffects> = {
  store: TStore
  sideEffects: SagaSideEffects & TSideEffects
  encrypt?: Encrypter
  decrypt?: Decrypter
}

export type SagaInitHandler<TStore, TSideEffect> = (
  context: SagaContext<TStore, TSideEffect>
) => Promise<void>

export type SagaEventHandler<TStore, TSideEffects> = (
  context: SagaContext<TStore, TSideEffects>,
  event: Event
) => Promise<void>

export type SagaEventHandlers<TStore, TSideEffects> = {
  [key: string]: SagaEventHandler<TStore, TSideEffects>
} & {
  Init?: SagaInitHandler<TStore, TSideEffects>
}

export type Saga<TStore = never, TSideEffects = {}> = {
  handlers: SagaEventHandlers<TStore, TSideEffects>
  sideEffects?: TSideEffects
}

export type SagaEncryptionContext = {
  secretsManager: SecretsManager
}

export type SagaEncryptionFactory = (
  event: Event,
  context: SagaEncryptionContext
) => Promise<Encryption | null>
