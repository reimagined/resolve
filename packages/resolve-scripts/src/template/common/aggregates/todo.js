/* @flow */

import events from '../events';
import validate from '../validate';

const Event = (type, payload) => ({
    type,
    payload
});

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events;

const Aggregate = {
    name: 'Todo',
    projection: {
        [TODO_CREATED]: (state, event) => ({ ...event.payload }),
        [TODO_COMPLETED]: state => ({
            ...state,
            completed: true
        }),
        [TODO_RESET]: state => ({
            ...state,
            completed: false
        })
    },
    commands: {
        createTodo: (state, command) => {
            validate.throwErrorIfAlreadyExists(state, command);
            return new Event(TODO_CREATED, {
                completed: false,
                text: command.payload.text
            });
        },
        completeTodo: (state, command) => {
            validate.throwErrorIfCompleted(state, command);
            return new Event(TODO_COMPLETED);
        },
        resetTodo: (state, command) => {
            validate.throwErrorIfNotCompleted(state, command);
            return new Event(TODO_RESET);
        }
    }
};

export default Aggregate;
