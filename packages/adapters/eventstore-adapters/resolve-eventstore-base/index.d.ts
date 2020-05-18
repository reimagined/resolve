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
