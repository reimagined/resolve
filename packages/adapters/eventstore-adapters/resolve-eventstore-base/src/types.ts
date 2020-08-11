export enum Status {
  NOT_CONNECTED,
  CONNECTED,
  DISPOSED,
}

interface IAdapterOptions {}

interface IAdapterImplementation<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions
> {
  connect(options: AdapterOptions): Promise<AdapterConnection>;
  dispose(connection: AdapterConnection): Promise<void>;
  init(connection: AdapterConnection): Promise<void>;
  get(connection: AdapterConnection): Promise<number>;
  set(connection: AdapterConnection, value: number): Promise<void>;

  loadEventsByCursor: (connection: AdapterConnection, filter: EventFilter) => {
    cursor: Cursor,
    events: Array<Event>
  },
  loadEventsByTimestamp: (connection: AdapterConnection, filter: EventFilter) => {
    cursor: never,
    events: Array<Event>
  },
  getLatestEvent: (connection: AdapterConnection, filter: EventFilterForLatestEvent) => Event,
  saveEvent: Function,
  init: Function,
  drop: Function,

  injectEvent: Function,
  isFrozen: Function,
  freeze: Function,
  unfreeze: Function,
  shapeEvent: Function,
  loadSnapshot: Function,
  saveSnapshot: Function,
  dropSnapshot: Function,
  getSecret: Function,
  setSecret: Function,
  deleteSecret: Function,
  beginIncrementalImport: Function,
  commitIncrementalImport: Function,
  rollbackIncrementalImport: Function,
  pushIncrementalImport: Function,

}

export interface IAdapter {
  init(): Promise<void>;
  get(): Promise<number>;
  set(value: number): Promise<void>;
  dispose(): Promise<void>;
}

interface AdapterState<AdapterConnection extends any> {
  connection: AdapterConnection | null;
  status: Status;
}


export type Event = {
  threadId: number,
  threadCounter: number,
  aggregateId: string,
  aggregateVersion: number,
  type: string,
  timestamp: number,
  payload: any
}

export type EventForIncrementalImport = {
  aggregateId: string,
  type: string,
  timestamp: number,
  payload: any
}

export type EventForSave = {
  aggregateId: string,
  aggregateVersion: number,
  type: string,
  timestamp: number,
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

export type AdapterImplementation<Connection extends any, Options extends any> = {
  connect(...args: Array<any>): Promise<Connection>,
  loadEventsByCursor: Function,
  loadEventsByTimestamp: Function,
  getLatestEvent: Function,
  saveEvent: Function,
  init: Function,
  drop: Function,
  dispose: Function,
  injectEvent: Function,
  isFrozen: Function,
  freeze: Function,
  unfreeze: Function,
  shapeEvent: Function,
  loadSnapshot: Function,
  saveSnapshot: Function,
  dropSnapshot: Function,
  getSecret: Function,
  setSecret: Function,
  deleteSecret: Function,
  beginIncrementalImport: Function,
  commitIncrementalImport: Function,
  rollbackIncrementalImport: Function,
  pushIncrementalImport: Function,
}
