import { ResolveStorageDriver } from "resolve-storage";

export = CreateMongoStorageDriver;

declare function CreateMongoStorageDriver(
  config: CreateMongoStorageDriver.Config
): ResolveMongoStorageDriver

declare namespace CreateMongoStorageDriver {
  export interface Config {
    url: string;
    collection: string;
  }

  export interface ResolveMongoStorageDriver extends ResolveStorageDriver {}
}
