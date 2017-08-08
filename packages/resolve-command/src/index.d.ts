import * as ResolveES from "resolve-es";

export = CreateCommand;
declare function CreateCommand(
  config: CreateCommand.Config
): CreateCommand.Command

declare namespace CreateCommand {
  export function Command(command: CommandDescription): Promise<void>;

  export type SerializableEntity = object | string | number | boolean;
  export type AggregateState = SerializableEntity;
  export type AggregateName = string;

  export interface CommandDescription {
    aggregateId: ResolveES.AggregateId;
    aggregateName: AggregateName;
    type: ResolveES.EventType;
    [payloadEntryName: string]: SerializableEntity;
  }

  export interface EventHandlersMap {
    [handlerName: string]: (
      event: ResolveES.Event,
      state: AggregateState
    ) => AggregateState;
  }

  export interface CommandsMap {
    [commandName: string]: (command: CommandDescription) => ResolveES.Event;
  }

  export interface Aggregate {
    eventHandlers: EventHandlersMap;
    commands: CommandsMap;
    initialState: AggregateState;
    name: AggregateName;
  }

  export interface Config {
    eventStore: ResolveES.ES;
    aggregates: Array<Aggregate>;
  }
}
