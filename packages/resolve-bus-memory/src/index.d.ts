import { ResolveBusDriver } from "resolve-bus";

export = CreateMemoryBusDriver;
declare function CreateMemoryBusDriver(): CreateMemoryBusDriver.ResolveMemoryDriver

declare namespace CreateMemoryBusDriver {
  export interface ResolveMemoryDriver extends ResolveBusDriver {}
}
