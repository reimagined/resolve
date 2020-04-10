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

// Aggregate

export declare type AggregateState = any
export declare type AggregateEventHandler = (
  state: AggregateState,
  event: Event
) => AggregateState

export declare type CommandContext = {
  jwt: string
  aggregateVersion: number
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
}

// Read model

declare type ReadModelContext = {}
declare type ReadModelInitHandler<TStore> = (store: TStore) => Promise<void>
declare type ReadModelEventHandler<TStore> = (
  store: TStore,
  event: Event,
  context: ReadModelContext
) => Promise<void>
export declare type ReadModel<TStore> = {
  Init: ReadModelInitHandler<TStore>
  [key: string]: ReadModelEventHandler<TStore>
}
declare type ReadModelResolver<TStore> = (
  store: TStore,
  params: SerializableMap,
  jwt: string
) => Promise<any>
export declare type ReadModelResolvers<TStore> = {
  [key: string]: ReadModelResolver<TStore>
}

