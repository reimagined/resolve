import * as ResolveStorage from "resolve-storage";

export = CreateMongoStorageDriver;

declare function CreateMongoStorageDriver(
  config: CreateMongoStorageDriver.Config
): CreateMongoStorageDriver.Driver

declare namespace CreateMongoStorageDriver {
  export interface Config {
    url: string;
    collection: string;
  }

  export interface Driver extends ResolveStorage.Driver {}
}
