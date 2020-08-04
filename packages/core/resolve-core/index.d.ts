// Primitives

declare type SerializablePrimitive = string | number | boolean | null
declare type SerializableMap = {
  [key: string]: Serializable
}
declare type SerializableArray = Array<Serializable>
declare type Serializable = SerializablePrimitive | SerializableMap | SerializableArray

// Common

export declare type Event = {
  type: string
  timestamp: number
  aggregateId: string
  aggregateVersion: number
  payload: SerializableMap
}

// Encryption

export declare type PlainData = Serializable
export declare type EncryptedBlob = string

export declare type SecretsManager = {
  getSecret: (id: string) => Promise<string>
  setSecret: (id: string, secret: string) => Promise<void>
  deleteSecret: (id: string) => Promise<void>
}

export declare type Encrypter = (data: PlainData) => EncryptedBlob
export declare type Decrypter = (blob: EncryptedBlob) => PlainData
export declare type Encryption = {
  encrypt?: Encrypter
  decrypt?: Decrypter
}

// Aggregate

export declare type AggregateState = any
export declare type AggregateEventHandler = (
  state: AggregateState,
  event: Event
) => AggregateState

export declare type CommandContext = {
  jwt?: string
  aggregateVersion: number
  encrypt: Encrypter | null
  decrypt: Decrypter | null
}

export declare type Command = {
  type: string
  aggregateId: string
  aggregateName: string
  payload?: SerializableMap
  jwt?: string
}

export declare type CommandResult = {
  type: string
  payload?: SerializableMap
  timestamp?: number
  aggregateId?: string
  aggregateVersion?: number
}

export declare type AggregateProjection = {
  Init?: () => AggregateState
} & {
  [key: string]: AggregateEventHandler
}

declare type CommandHandler = (
  state: AggregateState,
  command: Command,
  context: CommandContext
) => CommandResult | Promise<CommandResult>

export declare type Aggregate = {
  [key: string]: CommandHandler
}
export declare type AggregateEncryptionContext = {
  jwt?: string
  secretsManager: SecretsManager
}
export declare type AggregateEncryptionFactory = (
  aggregateId: string,
  context: AggregateEncryptionContext
) => Promise<Encryption | null>

// Read model

declare type ReadModelInitHandler<TStore> = (store: TStore) => Promise<void>
declare type ReadModelEventHandler<TStore> = (
  store: TStore,
  event: Event
) => Promise<void>
export declare type ReadModel<TStore> = {
  [key: string]: ReadModelEventHandler<TStore>
} & {
  Init: ReadModelInitHandler<TStore>
}
declare type ReadModelResolverContext = {
  jwt: string
  secretsManager: SecretsManager
}
declare type ReadModelResolver<TStore> = (
  store: TStore,
  params: SerializableMap,
  context: ReadModelResolverContext
) => Promise<any>
export declare type ReadModelResolvers<TStore> = {
  [key: string]: ReadModelResolver<TStore>
}

// Saga

// TODO: move types from resolve-client here?

declare type ReadModelQuery = {
  modelName: string
  resolverName: string
  resolverArgs: Serializable
  jwt: string
}
declare type ReadModelQueryResult = Serializable
declare type ViewModelQuery = {
  modelName: string
  aggregateIds: Array<string> | '*'
  aggregateArgs: Serializable
}
declare type ViewModelQueryResult = Serializable
declare type SagaSideEffects = {
  executeCommand: (command: Command) => Promise<CommandResult>
  executeQuery: (query: ReadModelQuery | ViewModelQuery) =>
    Promise<ReadModelQueryResult | ViewModelQueryResult>
  scheduleCommand: (timestamp: number, command: Command) => Promise<void>
  secretsManager: SecretsManager
  isEnabled: boolean
}
declare type SagaSideEffectProperties = {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: number
} & {
  [key: string]: SerializablePrimitive
}
export declare type SagaUserSideEffect =  (
    properties: SagaSideEffectProperties,
    sideEffects: SagaSideEffects,
    effectName: string,
    isEnabled: boolean
  ) => Promise<any>

export declare type SagaUserSideEffects = {
  [key: string]: SagaUserSideEffect
}

declare type SagaContext<TStore, TSideEffects extends SagaUserSideEffects> = {
  store: TStore
  sideEffects: SagaSideEffects & TSideEffects
  encrypt: Encrypter
  decrypt: Decrypter
}
declare type SagaInitHandler<TStore, TSideEffects extends SagaUserSideEffects> = (
  context: SagaContext<TStore, TSideEffects>
) => Promise<void>
declare type SagaEventHandler<TStore, TSideEffects extends SagaUserSideEffects> = (
  context: SagaContext<TStore, TSideEffects>,
  event: Event
) => Promise<void>
export declare type Saga<TStore = never, TSideEffects extends SagaUserSideEffects = {}> = {
  handlers: {
    [key: string]: SagaEventHandler<TStore, TSideEffects >
  } & {
    Init?: SagaInitHandler<TStore, TSideEffects>
  }
  sideEffects?: TSideEffects
}
export declare type SagaEncryptionContext = {
  secretsManager: SecretsManager
}
export declare type SagaEncryptionFactory = (
  event: Event,
  context: SagaEncryptionContext
) => Promise<Encryption | null>

// TODO: add view model types
