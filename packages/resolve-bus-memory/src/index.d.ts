import { ResolveBusDriver } from "resolve-bus";

export = CreateMemoryBusDriver;
declare function CreateMemoryBusDriver(): CreateMemoryBusDriver.ResolveMemoryBusDriver

declare namespace CreateMemoryBusDriver {
  export interface ResolveMemoryBusDriver extends ResolveBusDriver {}
}
