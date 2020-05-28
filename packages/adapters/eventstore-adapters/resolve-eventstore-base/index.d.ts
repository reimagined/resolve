declare class EventStoreError {
  code: string
  name: string
  message: string
}
declare namespace createAdapter {
  export class EventstoreResourceAlreadyExistError extends EventStoreError {
    constructor(message: string)
  }
  export class EventstoreResourceNotExistError extends EventStoreError {
    constructor(message: string)
  }
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
  saveEventOnly: Function
  paginateEvents: Function
  isFrozen?: Function
  freeze: Function
  unfreeze: Function
  shapeEvent: Function
} & {
  [key: string]: any
}): any

export = createAdapter
