import { Event, ResolveBusDriver } from "resolve-bus";

export = CreateRabbitMQBusDriver;
declare function CreateRabbitMQBusDriver(
  config: CreateRabbitMQBusDriver.RabbitMQBusConfig
): CreateRabbitMQBusDriver.ResolveRabbitMQDriver

declare namespace CreateRabbitMQBusDriver {
  export interface ResolveRabbitMQDriver extends ResolveBusDriver {
    publish: (Event) => Promise<void>;
  }

  export interface RabbitMQBusConfig {
    channelName: string;
    exchange: string;
    exchangeType: string;
    maxLength: number;
    messageTtl: number;
    queueName: string;
    url: string;
  }
}
