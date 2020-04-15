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
  payload: SerializableMap
}

// Encryption

export declare type PlainData = Serializable
export declare type EncryptedBlob = string

export declare type SecretStore = {
  getSecret: (id: string) => Promise<string>
  setSecret: (id: string) => Promise<void>
  deleteSecret: (id: string) => Promise<void>
}

export declare type Encrypter = (data: PlainData) => EncryptedBlob
export declare type Decrypter = (blob: EncryptedBlob) => PlainData

// Aggregate

export declare type AggregateState = any
export declare type AggregateContext = {
  encrypt: Encrypter
  decrypt: Decrypter
}
export declare type AggregateEventHandler = (
  state: AggregateState,
  event: Event,
  context: AggregateContext
) => AggregateState

export declare type CommandContext = {
  jwt: string
  aggregateVersion: number
  encrypt: Encrypter
  decrypt: Decrypter
}

export declare type Command = {
  type: string
  aggregateId: string
  payload: SerializableMap
}

export declare type CommandResult = {
  type: string
  payload?: SerializableMap
}

export declare type AggregateProjection = {
  Init?: () => AggregateState
  [key: string]: AggregateEventHandler
}

declare type CommandHandler = (
  state: AggregateState,
  command: Command,
  context: CommandContext
) => CommandResult

export declare type Aggregate = {
  [key: string]: CommandHandler
} & {
  EncryptionFactory?: (secretStore: SecretStore, command: Command, context: CommandContext) => Promise<{
    encrypt?: Encrypter
    decrypt?: Decrypter
  }>
}

// Read model

declare type ReadModelContext = {
  encrypt: Encrypter
  decrypt: Decrypter
}
declare type ReadModelInitHandler<TStore> = (store: TStore) => Promise<void>
declare type ReadModelEventHandler<TStore> = (
  store: TStore,
  event: Event,
  context: ReadModelContext
) => Promise<void>
export declare type ReadModel<TStore> = {
  [key: string]: ReadModelEventHandler<TStore>
} & {
  Init: ReadModelInitHandler<TStore>
} & {
  EncryptionFactory?: (store: TStore, event: Event, context: ReadModelContext) => Promise<{
    encrypt?: Encrypter
    decrypt?: Decrypter
  }>
}
declare type ReadModelResolver<TStore> = (
  store: TStore,
  params: SerializableMap,
  jwt: string
) => Promise<any>
export declare type ReadModelResolvers<TStore> = {
  [key: string]: ReadModelResolver<TStore>
}

