/* @flow */

import type { TodoCreated, TodoCompleted, TodoReset } from '../../aggregates/todo-events';
import events from '../../aggregates/todo-events';

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

export default {
    name: 'default',
    projection: {
        Init: () => [],
        [TODO_CREATED]: (state: any, event: TodoCreated) =>
            state.concat([
                {
                    todoId: event.payload.todoId,
                    completed: event.payload.completed,
                    text: event.payload.text
                }
            ]),

        [TODO_COMPLETED]: (state: any, event: TodoCompleted) =>
            state.map(
                todo => (todo.todoId === event.payload.todoId ? { ...todo, completed: true } : todo)
            ),

        [TODO_RESET]: (state: any, event: TodoReset) =>
            state.map(
                todo =>
                    todo.todoId === event.payload.todoId ? { ...todo, completed: false } : todo
            )
    },
    serializeState: state => JSON.stringify({ todos: Array.isArray(state) ? state : [] }),
    deserializeState: serial => JSON.parse(serial)
};
