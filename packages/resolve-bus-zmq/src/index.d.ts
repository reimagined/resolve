import * as ResolveBus from "resolve-bus";

export = CreateZMQBusDriver;

declare function CreateZMQBusDriver(
  config: CreateZMQBusDriver.Config
): CreateZMQBusDriver.Driver

declare namespace CreateZMQBusDriver {
  export interface Driver extends ResolveBus.Driver {
    publish(event: ResolveBus.Event): Promise<void>;
  }

  export interface Config {
    channel: string;
    address: string;
    pubPort: number;
    subPort: number;
  }
}
