/* @flow */

import type { TodoCreated, TodoCompleted, TodoReset } from '../aggregates/todo-events';
import events from '../aggregates/todo-events';

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

export const checkState = state => (Array.isArray(state) ? state : []);

export default {
    name: 'todos',
    viewModel: true,
    projection: {
        [TODO_CREATED]: (state: any, event: TodoCreated) =>
            checkState(state).concat([
                {
                    aggregateId: event.aggregateId,
                    completed: event.payload.completed,
                    text: event.payload.text
                }
            ]),
        [TODO_COMPLETED]: (state: any, event: TodoCompleted) =>
            checkState(state).map(
                todo =>
                    todo.aggregateId === event.aggregateId ? { ...todo, completed: true } : todo
            ),
        [TODO_RESET]: (state: any, event: TodoReset) =>
            checkState(state).map(
                todo =>
                    todo.aggregateId === event.aggregateId ? { ...todo, completed: false } : todo
            )
    }
};
