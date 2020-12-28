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

// Encryption

export type PlainData = Serializable
export type EncryptedBlob = string

export type SecretsManager = {
  getSecret: (id: string) => Promise<string>
  setSecret: (id: string, secret: string) => Promise<void>
  deleteSecret: (id: string) => Promise<void>
}

export type Encrypter = (data: PlainData) => EncryptedBlob
export type Decrypter = (blob: EncryptedBlob) => PlainData
export type Encryption = {
  encrypt?: Encrypter
  decrypt?: Decrypter
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
  encrypt: Encrypter | null
  decrypt: Decrypter | null
}

export type Command = {
  type: string
  aggregateId: string
  aggregateName: string
  payload: any
  jwt?: string
  jwtToken?: string // deprecated
}

export type CommandResult = {
  type: string
  payload: any
  timestamp?: number
  aggregateId?: string
  aggregateVersion?: number
}

export type AggregateProjection = {
  Init?: () => AggregateState
} & {
  [key: string]: AggregateEventHandler
}

export type CommandHandler = (
  state: AggregateState,
  command: Command,
  context: CommandContext
) => CommandResult | Promise<CommandResult>

export type Aggregate = {
  [key: string]: CommandHandler
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

type ReadModelHandlerContext = {
  encrypt: Encrypter | null
  decrypt: Decrypter | null
}
type ReadModelInitHandler<TStore> = (store: TStore) => Promise<void>
type ReadModelEventHandler<TStore> = (
  store: TStore,
  event: Event,
  context: ReadModelHandlerContext
) => Promise<void>
export type ReadModel<TStore> = {
  [key: string]: ReadModelEventHandler<TStore>
} & {
  Init: ReadModelInitHandler<TStore>
}
type ReadModelResolverContext = {
  jwt: string
  secretsManager: SecretsManager
}
type ReadModelResolver<TStore> = (
  store: TStore,
  params: SerializableMap,
  context: ReadModelResolverContext
) => Promise<any>
export type ReadModelResolvers<TStore> = {
  [key: string]: ReadModelResolver<TStore>
}
export type ReadModelEncryptionContext = {
  secretsManager: SecretsManager
}
export type ReadModelEncryptionFactory = (
  event: Event,
  context: ReadModelEncryptionContext
) => Promise<Encryption | null>

// Saga

// TODO: move types from resolve-client here?

type ReadModelQuery = {
  modelName: string
  resolverName: string
  resolverArgs: Serializable
  jwt?: string
  jwtToken?: string
}
type ReadModelQueryResult = Serializable
type ViewModelQuery = {
  modelName: string
  aggregateIds: Array<string> | '*'
  aggregateArgs: Serializable
}
type ViewModelQueryResult = Serializable
type SagaSideEffects = {
  executeCommand: (command: Command) => Promise<CommandResult>
  executeQuery: (
    query: ReadModelQuery | ViewModelQuery
  ) => Promise<ReadModelQueryResult | ViewModelQueryResult>
  scheduleCommand: (timestamp: number, command: Command) => Promise<void>
  secretsManager: SecretsManager
  isEnabled: boolean
}
type SagaSideEffectProperties = {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: number
} & {
  [key: string]: SerializablePrimitive
}
export type SagaUserSideEffect = (
  properties: SagaSideEffectProperties,
  sideEffects: SagaSideEffects,
  effectName: string,
  isEnabled: boolean
) => Promise<any>

export type SagaUserSideEffects = {
  [key: string]: SagaUserSideEffect
}

type SagaContext<TStore, TSideEffects extends SagaUserSideEffects> = {
  store: TStore
  sideEffects: SagaSideEffects & TSideEffects
  encrypt: Encrypter
  decrypt: Decrypter
}
type SagaInitHandler<TStore, TSideEffects extends SagaUserSideEffects> = (
  context: SagaContext<TStore, TSideEffects>
) => Promise<void>
type SagaEventHandler<TStore, TSideEffects extends SagaUserSideEffects> = (
  context: SagaContext<TStore, TSideEffects>,
  event: Event
) => Promise<void>
export type Saga<
  TStore = never,
  TSideEffects extends SagaUserSideEffects = {}
> = {
  handlers: {
    [key: string]: SagaEventHandler<TStore, TSideEffects>
  } & {
    Init?: SagaInitHandler<TStore, TSideEffects>
  }
  sideEffects?: TSideEffects
}
export type SagaEncryptionContext = {
  secretsManager: SecretsManager
}
export type SagaEncryptionFactory = (
  event: Event,
  context: SagaEncryptionContext
) => Promise<Encryption | null>

export type Monitoring = {
  error?: (error: Error, part: string, meta: any) => Promise<void>
}
