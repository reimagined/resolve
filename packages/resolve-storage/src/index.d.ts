export = CreateStorage;

declare function CreateStorage({
  driver: ResolveStorageDriver
}): CreateStorage.ResolveStorage

declare namespace CreateStorage {
  export type EventType = string;
  export type AggregateIdType = string;
  export interface Event {
    type: EventType;
    aggregateId: AggregateIdType;
    timestamp: Date;
  }
  export type EventHandler = ((Event) => void);

  export interface ResolveStorage {
    saveEvent(event: Event): Promise<void>;

    loadEventsByTypes(
      types: Array<EventType>,
      callback: EventHandler
    ): Promise<Array<Event>>;

    loadEventsByAggregateId(
      aggregateId: AggregateIdType,
      callback: EventHandler
    ): Promise<Array<Event>>;
  }

  export interface ResolveStorageDriver extends ResolveStorage {}
}
