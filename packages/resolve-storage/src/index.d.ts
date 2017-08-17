export = CreateStorage;

declare function CreateStorage(
  config: CreateStorage.Config
): CreateStorage.Storage

declare namespace CreateStorage {
  export type EventType = string;
  export type AggregateIdType = string;
  export interface Event {
    type: EventType;
    aggregateId: AggregateIdType;
    timestamp: Date;
  }
  export type EventHandler = ((Event) => void);

  export interface Storage {
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
  export interface Driver extends Storage {}

  export interface Config {
    driver: Driver;
  }
}
