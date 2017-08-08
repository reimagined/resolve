import { Event, ResolveBusDriver } from "resolve-bus";

export = CreateZMQBusDriver;

declare function CreateZMQBusDriver(
  config: CreateZMQBusDriver.ZMQBusConfig
): CreateZMQBusDriver.ResolveZMQBusDriver

declare namespace CreateZMQBusDriver {
  export interface ResolveZMQBusDriver extends ResolveBusDriver {
    publish: (Event) => Promise<void>;
  }

  export interface ZMQBusConfig {
    channel: string;
    address: string;
    pubPort: number;
    subPort: number;
  }
}
