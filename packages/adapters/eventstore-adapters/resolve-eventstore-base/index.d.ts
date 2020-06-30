declare class EventStoreError {
  code: string
  name: string
  message: string
  constructor(message: string)
}
declare function createAdapter(adapter: {
  connect: Function
  loadEventsByCursor: Function
  loadEventsByTimestamp: Function
  getLatestEvent: Function
  saveEvent: Function
  init: Function
  drop: Function
  dispose: Function
  injectEvent: Function
  isFrozen?: Function
  freeze: Function
  unfreeze: Function
  shapeEvent: Function
} & {
  [key: string]: any
}): any

export default createAdapter
export class EventstoreResourceAlreadyExistError extends EventStoreError {}
export class EventstoreResourceNotExistError extends EventStoreError {}
export class ConcurrentError extends EventStoreError {
  constructor(aggregateId: string)
}
export const throwBadCursor: Function
export const getNextCursor: (prevCursor: any, events: any) => Promise<any>
export const MAINTENANCE_MODE_AUTO: symbol
export const MAINTENANCE_MODE_MANUAL: symbol
