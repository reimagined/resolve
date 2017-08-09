import * as Redux from "redux";

export type SerializableEntiry = object | string | number | boolean;
export type StateObject = SerializableEntiry;
export type PayloadObject = { [key: string]: SerializableEntiry };

export namespace actions {
  export function merge(
    readModelName: string,
    state: StateObject
  ): {
    type: string;
    readModelName: string;
    state: StateObject;
  };

  export function sendCommand(config: {
    command: string;
    aggregateId: string;
    aggregateName: string;
    payload?: PayloadObject;
  }): {
    type: string;
    command: string;
    aggregateId: string;
    aggregateName: string;
    payload?: PayloadObject;
  };

  export function fetchMore(
    readModelName: string,
    query: string
  ): {
    type: string;
    readModelName: string;
    query: string;
  };
}

export function createActions(
  config: {
    name: string;
    commands: {
      [handlerName: string]: (
        event: Redux.Action,
        state: StateObject
      ) => StateObject;
    };
  },
  extendActions: Redux.ActionCreatorsMapObject
): Redux.ActionCreatorsMapObject;

export function createReducer(
  config: {
    name: string;
    eventHandlers: {
      [handlerName: string]: (
        event: Redux.Action,
        state: StateObject
      ) => StateObject;
    };
  },
  extendReducer: Redux.Reducer<StateObject>
): Redux.Reducer<StateObject>;

export function sendCommandMiddleware(params: {
  sendCommand: (
    command: {
      type: string;
      aggregateId: string;
      aggregateName: string;
      payload?: PayloadObject;
    }
  ) => Promise<void>;
}): Redux.Middleware;

export function fetchMoreMiddleware(params: {
  fetchMore: (readModelName: string, query: string) => Promise<StateObject>;
}): Redux.Middleware;
