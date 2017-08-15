/* @flow */

import type { TodoCreated, TodoCompleted, TodoReset } from './todo-events';
import events from './todo-events';

const Event = (type, payload) => ({
    type,
    payload
});

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

const throwErrorIfNull = state => {
  if(state === null) {
    throw new Error('The aggregate has already been removed');
  }
}

const Aggregate = {
  name: 'Todo',
  initialState: {},
  eventHandlers: {
    [TODO_CREATED]: (state: any, event: TodoCreated) => ({...event.payload}),
    [TODO_COMPLETED]: (state: any, event: TodoCompleted) => {
      state.completed = true;
      return state;
    },
    [TODO_RESET]: (state: any, event: TodoReset) => {
      state.completed = false;
      return state;
    }
  },
  commands: {
    createTodo: (state: any, command: TodoCreated) =>
      new Event(TODO_CREATED, {
        completed: false,
        text: command.payload.text
      }),
    completeTodo: (state: TodoCompleted, command: TodoCompleted) => {
      throwErrorIfNull(state);
      return state.completed
        ? null
        : new Event(TODO_COMPLETED, { });
    },
    resetTodo: (state: TodoCompleted, command: TodoReset) => {
      throwErrorIfNull(state);
      return !state.completed
        ? null
        : new Event(TODO_RESET, { });
    }
  }
};

export default Aggregate;
