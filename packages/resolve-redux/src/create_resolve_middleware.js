import { SUBSCRIBE, UNSUBSCRIBE, SEND_COMMAND } from './action_types';
import actions from './actions';
import socketIOClient from 'socket.io-client';

import { getRootableUrl, getKey, checkRequiredFields } from './util';
import fetch from 'isomorphic-fetch';

const CRITICAL_LEVEL = 100;
const REFRESH_TIMEOUT = 1000;

export const api = {
    async sendCommand(store, action) {
        const { command, aggregateId, aggregateName, payload } = action;

        if (
            !(
                command &&
                checkRequiredFields(
                    { aggregateId, aggregateName },
                    'Send command error:',
                    JSON.stringify(action)
                ) &&
                !(command.ok || command.error)
            )
        ) {
            return;
        }

        const normalizedCommand = {
            type: command.type,
            aggregateId,
            aggregateName,
            payload
        };

        try {
            const response = await fetch(getRootableUrl('/api/commands'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(normalizedCommand)
            });

            if (response.ok) {
                store.dispatch({
                    ...action,
                    command: {
                        ...action.command,
                        ok: true
                    }
                });

                return;
            }

            const text = await response.text();
            // eslint-disable-next-line no-console
            console.error('Send command error:', text);
            throw new Error(text);
        } catch (error) {
            store.dispatch({
                ...action,
                command: {
                    ...action.command,
                    error
                }
            });
        }
    },

    async getViewModelRawState(viewModelName, aggregateId) {
        const response = await fetch(
            getRootableUrl(
                `/api/query/${viewModelName}?aggregateIds${
                    aggregateId === '*' ? '' : '[]'
                }=${aggregateId}`
            ),
            {
                method: 'GET',
                credentials: 'same-origin'
            }
        );

        if (!response.ok) {
            throw new Error(response.text());
        }

        return await response.json();
    }
};

export function getEventTypes(viewModels, subscribers) {
    const eventTypes = {};

    Object.keys(subscribers.viewModels).forEach((viewModelName) => {
        if (!subscribers.viewModels[viewModelName]) {
            return;
        }

        const { Init, ...projection } = viewModels.find(
            ({ name }) => name === viewModelName
        ).projection;

        Object.keys(projection).forEach((eventType) => {
            eventTypes[eventType] = true;
        });
    });

    return Object.keys(eventTypes);
}

export function getAggregateIds(viewModels, subscribers) {
    if (subscribers.aggregateIds['*'] > 0) {
        return '*';
    }

    return Object.keys(subscribers.aggregateIds).filter(
        aggregateId => subscribers.aggregateIds[aggregateId]
    );
}

export function initSocketIO(store, socket = { failCount: 0, io: null }) {
    socket.io = socketIOClient(window.location.origin, {
        path: getRootableUrl('/socket/')
    });

    socket.io.on('event', event => store.dispatch(JSON.parse(event)));

    socket.io.on('disconnect', () => {
        socket.failCount++;
        if (socket.failCount > CRITICAL_LEVEL) {
            window.location.reload();
        }
        initSocketIO(store, socket);
    });

    return socket;
}

export async function subscribe(store, socket, viewModels, subscribers, requests, action) {
    const { viewModelName, aggregateId } = action;

    const needChange =
        !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId];

    subscribers.viewModels[viewModelName] = (subscribers.viewModels[viewModelName] || 0) + 1;
    subscribers.aggregateIds[aggregateId] = (subscribers.aggregateIds[aggregateId] || 0) + 1;

    if (needChange) {
        const key = getKey(viewModelName, aggregateId);
        requests[key] = true;

        const rawState = await api.getViewModelRawState(viewModelName, aggregateId);

        const state = viewModels
            .find(({ name }) => name === viewModelName)
            .deserializeState(rawState);

        if (requests[key]) {
            delete requests[key];

            store.dispatch(actions.merge(viewModelName, aggregateId, state));

            socket.io.emit('setSubscription', {
                types: getEventTypes(viewModels, subscribers),
                ids: getAggregateIds(viewModels, subscribers)
            });
        }
    }
}

export function unsubscribe(store, socket, viewModels, subscribers, requests, action) {
    const { viewModelName, aggregateId } = action;

    subscribers.viewModels[viewModelName] = Math.max(
        (subscribers.viewModels[viewModelName] || 0) - 1,
        0
    );
    subscribers.aggregateIds[aggregateId] = Math.max(
        (subscribers.aggregateIds[aggregateId] || 0) - 1,
        0
    );

    const needChange =
        !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId];

    const key = getKey(viewModelName, aggregateId);
    delete requests[key];

    if (needChange) {
        socket.io.emit('setSubscription', {
            types: getEventTypes(viewModels, subscribers),
            ids: getAggregateIds(viewModels, subscribers)
        });
    }
}

export function createResolveMiddleware(viewModels) {
    const subscribers = {
        viewModels: {},
        aggregateIds: {}
    };

    const requests = {};

    return (store) => {
        store.dispatch(actions.provideViewModels(viewModels));

        const socket = initSocketIO(store);

        return next => (action) => {
            switch (action.type) {
                case SUBSCRIBE: {
                    subscribe(store, socket, viewModels, subscribers, requests, action).catch(
                        error =>
                            setTimeout(() => {
                                // eslint-disable-next-line no-console
                                console.error(error);
                                store.dispatch(action);
                            }, REFRESH_TIMEOUT)
                    );
                    break;
                }
                case UNSUBSCRIBE: {
                    unsubscribe(store, socket, viewModels, subscribers, requests, action);
                    break;
                }
                case SEND_COMMAND: {
                    api.sendCommand(store, action);
                    break;
                }
                default:
            }

            return next(action);
        };
    };
}

const middleware =
    typeof window === 'undefined'
        ? () => () => next => action => next(action)
        : createResolveMiddleware;

export default middleware;
