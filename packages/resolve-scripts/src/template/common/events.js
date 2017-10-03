/* @flow */
/* eslint-disable no-undef */

const events = {
    TODO_CREATED: 'TodoCreated',
    TODO_COMPLETED: 'TodoCompleted',
    TODO_RESET: 'TodoReset'
};

export type Event<Payload> = {
    aggregateId: string,
    timestamp: string,
    payload: Payload
};

export type TodoCreated = {
    text: string,
    completed: boolean
};

export type TodoCompleted = {};

export type TodoReset = {};

export default events;
