export enum Status {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTED = 'CONNECTED',
  DISPOSED = 'DISPOSED'
}

export type Event = {
  threadId: number
  threadCounter: number
  aggregateId: string
  aggregateVersion: number
  type: string
  timestamp: number
  payload: any
}

export type EventForIncrementalImport = {
  aggregateId: string
  type: string
  timestamp: number
  payload: any
}

export type EventForSave = {
  aggregateId: string
  aggregateVersion: number
  type: string
  timestamp: number
  payload: any
}

export type Cursor = string | null

export type EventFilter = {
  limit: number
  eventTypes?: Array<string> | null
  aggregateIds?: Array<string> | null
  eventsSizeLimit?: number
  cursor?: Cursor
  startTime?: number
  finishTime?: number
}

export type EventFilterForLatestEvent = {
  eventTypes?: Array<string> | null
  aggregateIds?: Array<string> | null
}

export type IEventFromDatabase = {}

export type IAdapterOptions = {
  snapshotBucketSize?: number
}

export type AdapterState<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions
> = {
  connection: AdapterConnection | null
  status: Status
  config: AdapterConfig<AdapterOptions>
  snapshotBucketSize: number
}

export type AdapterConfig<
  AdapterOptions extends IAdapterOptions
> = AdapterOptions & {
  snapshotBucketSize: number
}

export type AdapterImplementation<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
> = {
  getConfig(options: AdapterOptions): AdapterConfig<AdapterOptions>
  connect(config: AdapterConfig<AdapterOptions>): Promise<AdapterConnection>
  dispose(state: AdapterState<AdapterConnection, AdapterOptions>): Promise<void>
  loadEventsByCursor: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    filter: EventFilter
  ) => Promise<{
    cursor: Cursor
    events: Array<Event>
  }>
  loadEventsByTimestamp: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    filter: EventFilter
  ) => Promise<{
    cursor: Cursor
    events: Array<Event>
  }>
  getLatestEvent: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    filter: EventFilterForLatestEvent
  ) => Promise<Event>
  saveEvent: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    event: EventForSave
  ) => Promise<void>
  init: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<void>
  drop: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<void>
  injectEvent: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    event: Event
  ) => Promise<void>
  isFrozen?: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<boolean>
  freeze: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<void>
  unfreeze: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<void>
  shapeEvent: (event: EventFromDatabase) => Event
  loadSnapshot: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    snapshotKey: string
  ) => Promise<string>
  saveSnapshot: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    snapshotKey: string,
    content: string
  ) => Promise<void>
  dropSnapshot: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    snapshotKey: string
  ) => Promise<void>
  getSecret: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    selector: string
  ) => Promise<string>
  setSecret: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    selector: string,
    secret: string
  ) => Promise<void>
  deleteSecret: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    selector: string
  ) => Promise<void>
  beginIncrementalImport: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<string>
  commitIncrementalImport: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    importId: string,
    validateAfterCommit?: boolean
  ) => Promise<void>
  rollbackIncrementalImport: (
    state: AdapterState<AdapterConnection, AdapterOptions>
  ) => Promise<void>
  pushIncrementalImport: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    events: Array<EventForIncrementalImport>
  ) => Promise<void>
}

export type IAdapter = {
  dispose(): Promise<void>
  loadEvents: (
    filter: EventFilter
  ) => Promise<{
    cursor: Cursor
    events: Array<Event>
  }>
  getLatestEvent: (filter: EventFilterForLatestEvent) => Promise<Event>
  saveEvent: (event: EventForSave) => Promise<void>
  init: () => Promise<void>
  drop: () => Promise<void>
  injectEvent: (event: Event) => Promise<void>
  isFrozen: () => Promise<boolean>
  freeze: () => Promise<void>
  unfreeze: () => Promise<void>
  loadSnapshot: (snapshotKey: string) => Promise<string>
  saveSnapshot: (snapshotKey: string, content: string) => Promise<void>
  dropSnapshot: (snapshotKey: string) => Promise<void>
  getSecret: (selector: string) => Promise<string>
  setSecret: (selector: string, secret: string) => Promise<void>
  deleteSecret: (selector: string) => Promise<void>
  beginIncrementalImport: () => Promise<string>
  commitIncrementalImport: (
    importId: string,
    validateAfterCommit?: boolean
  ) => Promise<void>
  rollbackIncrementalImport: () => Promise<void>
  pushIncrementalImport: (
    events: Array<EventForIncrementalImport>
  ) => Promise<void>
}

//
// export type AdapterImplementation<
//   AdapterConnection extends any,
//   AdapterOptions extends IAdapterOptions
// > = {
//   getConfig(options: AdapterOptions): AdapterConfig<AdapterOptions>,
//   connect(config: AdapterConfig<AdapterOptions>): Promise<AdapterConnection>
//   loadEventsByCursor(state: AdapterState<AdapterConnection, AdapterOptions>, filter: EventFilter): {
//     cursor: Cursor
//     events: Array<Event>
//   }
//   loadEventsByTimestamp(state: AdapterState<AdapterConnection, AdapterOptions>, filter: EventFilter): {
//     cursor: Cursor
//     events: Array<Event>
//   }
//   getLatestEvent(state: AdapterState<AdapterConnection, AdapterOptions>, filter: EventFilterForLatestEvent): Event
//   saveEvent(state: AdapterState<AdapterConnection, AdapterOptions>, event: EventForSave): Promise<void>
//   init(state: AdapterState<AdapterConnection, AdapterOptions>): Promise<void>
//   drop(state: AdapterState<AdapterConnection, AdapterOptions>): Promise<void>
//   dispose(state: AdapterState<AdapterConnection, AdapterOptions>): Promise<void>
//   injectEvent(event: Event): Promise<void>
//   isFrozen: Function
//   freeze: Function
//   unfreeze: Function
//   shapeEvent: Function
//   loadSnapshot: Function
//   saveSnapshot: Function
//   dropSnapshot: Function
//   getSecret: Function
//   setSecret: Function
//   deleteSecret: Function
//   beginIncrementalImport: Function
//   commitIncrementalImport: Function
//   rollbackIncrementalImport: Function
//   pushIncrementalImport: Function
// }
