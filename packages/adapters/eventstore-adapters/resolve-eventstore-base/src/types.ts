export enum Status {
  NOT_CONNECTED,
  CONNECTED,
  DISPOSED
}

export interface IAdapterOptions {}
export interface IEventFromDatabase {}

export interface IAdapterImplementation<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
> {
  connect(options: AdapterOptions): Promise<AdapterConnection>
  dispose(connection: AdapterConnection): Promise<void>
  loadEventsByCursor: (
    connection: AdapterConnection,
    filter: EventFilter
  ) => {
    cursor: Cursor
    events: Array<Event>
  }
  loadEventsByTimestamp: (
    connection: AdapterConnection,
    filter: EventFilter
  ) => {
    cursor: Cursor
    events: Array<Event>
  }
  getLatestEvent: (
    connection: AdapterConnection,
    filter: EventFilterForLatestEvent
  ) => Event
  saveEvent: (
    connection: AdapterConnection,
    event: EventForSave
  ) => Promise<void>
  init: (connection: AdapterConnection) => Promise<void>
  drop: (connection: AdapterConnection) => Promise<void>
  injectEvent: (connection: AdapterConnection, event: Event) => Promise<void>
  isFrozen: (connection: AdapterConnection) => Promise<boolean>
  freeze: (connection: AdapterConnection) => Promise<void>
  unfreeze: (connection: AdapterConnection) => Promise<void>
  shapeEvent: (event: EventFromDatabase) => Event
  loadSnapshot: (
    connection: AdapterConnection,
    snapshotKey: string
  ) => Promise<string>
  saveSnapshot: (
    connection: AdapterConnection,
    snapshotKey: string,
    content: string
  ) => Promise<void>
  dropSnapshot: (
    connection: AdapterConnection,
    snapshotKey: string
  ) => Promise<void>
  getSecret: (
    connection: AdapterConnection,
    selector: string
  ) => Promise<string>
  setSecret: (
    connection: AdapterConnection,
    selector: string,
    secret: string
  ) => Promise<void>
  deleteSecret: (
    connection: AdapterConnection,
    selector: string
  ) => Promise<void>
  beginIncrementalImport: (connection: AdapterConnection) => Promise<string>
  commitIncrementalImport: (
    connection: AdapterConnection,
    importId: string,
    validateAfterCommit?: boolean
  ) => Promise<void>
  rollbackIncrementalImport: (connection: AdapterConnection) => Promise<void>
  pushIncrementalImport: (
    connection: AdapterConnection,
    events: Array<EventForIncrementalImport>
  ) => Promise<void>
}

export interface IAdapter {
  dispose(): Promise<void>
  loadEvents: (
    filter: EventFilter
  ) => {
    cursor: Cursor
    events: Array<Event>
  }
  getLatestEvent: (filter: EventFilterForLatestEvent) => Event
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

export interface AdapterState<AdapterConnection extends any> {
  connection: AdapterConnection | null
  status: Status
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

export type AdapterImplementation<
  Connection extends any,
  Options extends any
> = {
  connect(...args: Array<any>): Promise<Connection>
  loadEventsByCursor: Function
  loadEventsByTimestamp: Function
  getLatestEvent: Function
  saveEvent: Function
  init: Function
  drop: Function
  dispose: Function
  injectEvent: Function
  isFrozen: Function
  freeze: Function
  unfreeze: Function
  shapeEvent: Function
  loadSnapshot: Function
  saveSnapshot: Function
  dropSnapshot: Function
  getSecret: Function
  setSecret: Function
  deleteSecret: Function
  beginIncrementalImport: Function
  commitIncrementalImport: Function
  rollbackIncrementalImport: Function
  pushIncrementalImport: Function
}
