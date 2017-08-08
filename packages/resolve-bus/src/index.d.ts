export = CreateBus;
declare function CreateBus({ driver: ResolveBusDriver }): CreateBus.ResolveBus

declare namespace CreateBus {
  export type EventType = string;
  export interface Event {
    type: EventType;
  }
  export type EventHandler = ((Event) => void);

  export interface ResolveBus {
    emitEvent(event: Event): void;
    onEvent(eventTypes: Array<EventType>, callback: EventHandler): (() => void);
  }

  export interface ResolveBusDriver {
    publish(event: Event): void;
    setTrigger(trigger: EventHandler): void;
  }
}
