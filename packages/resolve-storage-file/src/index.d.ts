import * as ResolveStorage from "resolve-storage";

export = CreateFileStorageDriver;

declare function CreateFileStorageDriver(
  config: CreateFileStorageDriver.Config
): CreateFileStorageDriver.Driver

declare namespace CreateFileStorageDriver {
  export interface Config {
    pathToFile: string;
  }

  export interface Driver extends ResolveStorage.Driver {}
}
