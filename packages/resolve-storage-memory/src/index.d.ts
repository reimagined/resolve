import { ResolveStorageDriver } from "resolve-storage";

export = CreateMemoryStorageDriver;
declare function CreateMemoryStorageDriver(): ResolveMemoryStorageDriver

declare namespace CreateMemoryStorageDriver {
  export interface ResolveMemoryStorageDriver extends ResolveStorageDriver {}
}
