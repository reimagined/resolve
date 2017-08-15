/* @flow */

import type { TodoCreated, TodoCompleted, TodoReset } from '../aggregates/todo-events';
import events from '../aggregates/todo-events';

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

export default {
  name: 'todos',
  initialState: [],

  eventHandlers: {
    [TODO_CREATED]: (state: any, event: TodoCreated) =>
      state.concat([{
        aggregateId: event.aggregateId,
        completed: event.payload.completed,
        text: event.payload.text
      }
    ]),
    [TODO_COMPLETED]: (state: any, event: TodoCompleted) =>
      state.map(
        todo =>
          (todo.aggregateId === event.aggregateId
            ? { ...todo, completed: true }
            : todo)
      ),
      [TODO_RESET]: (state: any, event: TodoReset) =>
        state.map(
          todo =>
            (todo.aggregateId === event.aggregateId
              ? { ...todo, completed: false }
              : todo)
        ),
  }
};
