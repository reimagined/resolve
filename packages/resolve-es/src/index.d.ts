import * as ResolveBus from "resolve-bus";
import * as ResolveStorage from "resolve-storage";

export = CreateES;
declare function CreateES(
  config: CreateES.Config,
  errorHandler: CreateES.ErrorHandler
): CreateES.ES

declare namespace CreateES {
  export type EventType = string;
  export type AggregateId = string;
  export type Timestamp = Date;

  export interface EventPayload {
    [fieldName: string]: object;
  }

  export interface Event {
    type: EventType;
    aggregateId: AggregateId;
    timestamp: Timestamp;
    payload?: EventPayload;
  }

  export type EventHandler = ((event: Event) => void);

  export type SourceCancel = () => void;
  export type SourceChange = Promise<SourceCancel>;
  export type SourceDone = Promise<void>;

  export type ErrorHandler = ((error: Error) => void);

  export interface ES {
    subscribeByEventType(
      eventTypes: Array<EventType>,
      handler: EventHandler
    ): SourceChange;

    getEventsByAggregateId(
      aggregateId: AggregateId,
      handler: EventHandler
    ): SourceDone;

    onEvent(eventTypes: Array<EventType>, callback: EventHandler): void;

    saveEvent(event: Event): SourceDone;
  }

  export interface Config {
    storage: ResolveStorage.Storage;
    bus: ResolveBus.Bus;
  }
}
