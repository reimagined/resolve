export default function createAdapter(adapter: {
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

export const EventstoreResourceAlreadyExistError: any
export const EventstoreResourceNotExistError: any
export const ConcurrentError: any
export const MAINTENANCE_MODE_AUTO: any
export const MAINTENANCE_MODE_MANUAL: any
export const throwBadCursor: Function


