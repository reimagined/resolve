/* @flow */

import type { Event, TodoCreated, TodoCompleted, TodoReset } from '../events';
import events from '../events';

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

export default {
    name: 'todos',
    viewModel: true,
    projection: {
        [TODO_CREATED]: (state = [], event: Event<TodoCreated>) =>
            state.concat([
                {
                    aggregateId: event.aggregateId,
                    completed: event.payload.completed,
                    text: event.payload.text
                }
            ]),
        [TODO_COMPLETED]: (state = [], event: Event<TodoCompleted>) =>
            state.map(
                todo =>
                    todo.aggregateId === event.aggregateId ? { ...todo, completed: true } : todo
            ),
        [TODO_RESET]: (state = [], event: Event<TodoReset>) =>
            state.map(
                todo =>
                    todo.aggregateId === event.aggregateId ? { ...todo, completed: false } : todo
            )
    }
};
