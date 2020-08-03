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
