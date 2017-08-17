import * as ResolveStorage from "resolve-storage";

export = CreateMemoryStorageDriver;
declare function CreateMemoryStorageDriver(): CreateMemoryStorageDriver.Driver

declare namespace CreateMemoryStorageDriver {
  export interface Driver extends ResolveStorage.Driver {}
}
