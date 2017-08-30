/* @flow */
/* eslint-disable no-undef */

const events = {
    TODO_CREATED: 'TodoCreated',
    TODO_COMPLETED: 'TodoCompleted',
    TODO_RESET: 'TodoReset'
};

export type TodoCreated = {
    aggregateId: string,
    payload: {
        text: string,
        completed: boolean
    }
};

export type TodoCompleted = {
    aggregateId: string
};

export type TodoReset = {
    aggregateId: string
};

export default events;
