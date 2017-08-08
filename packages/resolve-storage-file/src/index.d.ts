import { ResolveStorageDriver } from "resolve-storage";

export = CreateFileStorageDriver;

declare function CreateFileStorageDriver(
  config: CreateFileStorageDriver.Config
): ResolveFileStorageDriver

declare namespace CreateFileStorageDriver {
  export interface Config {
    pathToFile: string;
  }

  export interface ResolveFileStorageDriver extends ResolveStorageDriver {}
}
