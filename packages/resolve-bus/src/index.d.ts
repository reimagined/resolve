export = CreateBus;
declare function CreateBus(config: CreateBus.Config): CreateBus.Bus

declare namespace CreateBus {
  export type EventType = string;
  export interface Event {
    type: EventType;
  }
  export type EventHandler = ((Event) => void);

  export interface Bus {
    emitEvent(event: Event): void;
    onEvent(eventTypes: Array<EventType>, callback: EventHandler): (() => void);
  }

  export interface Driver {
    publish(event: Event): void;
    setTrigger(trigger: EventHandler): void;
  }

  export interface Config {
    driver: Driver;
  }
}
