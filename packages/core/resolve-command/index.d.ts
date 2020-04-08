declare type PlainData = string | object
declare type EncryptedBlob = string
declare type AggregateState = any
declare type AggregateEvent = {
  type: string
  timestamp: number
  payload: any
}
declare type ProjectionEventHandler = (
  state: AggregateState,
  event: AggregateEvent
) => AggregateState

export declare type CommandContext = {
  jwt: string
  aggregateVersion: number
  encrypt?: (data: PlainData) => EncryptedBlob
  decrypt?: (blob: EncryptedBlob) => PlainData
}

export declare type Command = {
  type: string
  aggregateId: string
  payload: any
}

export declare type CommandResult = {
  type: string
  payload?: any
}

export declare type AggregateProjection = {
  Init?: () => AggregateState
  [key: string]: ProjectionEventHandler
}

declare type CommandHandler = (
  state: AggregateState,
  command: Command,
  context: CommandContext
) => CommandResult

export declare type Aggregate = {
  [key: string]: CommandHandler
}
