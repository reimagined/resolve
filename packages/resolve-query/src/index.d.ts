import * as ResolveES from "resolve-es";

export = CreateQuery;
declare function CreateQuery(config: CreateQuery.Config): CreateQuery.Query

declare namespace CreateQuery {
  export function Query(readModelName: ReadModelName): Promise<ReadModelState>;

  export type SerializableEntity = object | string | number | boolean;
  export type ReadModelState = SerializableEntity;
  export type ReadModelName = string;

  export interface QueryDescription {
    ReadModelId: ResolveES.ReadModelId;
    ReadModelName: ReadModelName;
    type: ResolveES.EventType;
    [payloadEntryName: string]: SerializableEntity;
  }

  export interface EventHandlersMap {
    [handlerName: string]: (
      event: ResolveES.Event,
      state: ReadModelState
    ) => ReadModelState;
  }

  export interface ReadModel {
    eventHandlers: EventHandlersMap;
    initialState: ReadModelState;
    name: ReadModelName;
  }

  export interface Config {
    eventStore: ResolveES.ES;
    readModels: Array<ReadModel>;
  }
}
