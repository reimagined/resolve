import actions, { SUBSCRIBE, UNSUBSCRIBE, SEND_COMMAND, MERGE } from './actions';
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
                !command.error
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
                return response.blob();
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

    async getViewModelRawState(viewModel, aggregateId) {
        const response = await fetch(
            getRootableUrl(
                `/api/query/${viewModel}?aggregateIds${aggregateId === '*'
                    ? ''
                    : '[]'}=${aggregateId}`
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

    Object.keys(subscribers.viewModels).forEach((viewModel) => {
        if (!subscribers.viewModels[viewModel]) {
            return;
        }

        const { Init, ...projection } = viewModels.find(
            ({ name }) => name === viewModel
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
    const { viewModel, aggregateId } = action;

    const needChange = !subscribers.viewModels[viewModel] || !subscribers.aggregateIds[aggregateId];

    subscribers.viewModels[viewModel] = (subscribers.viewModels[viewModel] || 0) + 1;
    subscribers.aggregateIds[aggregateId] = (subscribers.aggregateIds[aggregateId] || 0) + 1;

    if (needChange) {
        const key = getKey(viewModel, aggregateId);
        requests[key] = true;

        const rawState = await api.getViewModelRawState(viewModel, aggregateId);

        const state = viewModels.find(({ name }) => name === viewModel).deserializeState(rawState);

        if (requests[key]) {
            delete requests[key];

            store.dispatch(action.merge(viewModel, aggregateId, state));

            socket.io.emit('setSubscription', {
                types: getEventTypes(viewModels, subscribers),
                ids: getAggregateIds(viewModels, subscribers)
            });
        }
    }
}

export function unsubscribe(store, socket, viewModels, subscribers, requests, action) {
    const { viewModel, aggregateId } = action;

    subscribers.viewModels[viewModel] = Math.max((subscribers.viewModels[viewModel] || 0) - 1, 0);
    subscribers.aggregateIds[aggregateId] = Math.max(
        (subscribers.aggregateIds[aggregateId] || 0) - 1,
        0
    );

    const needChange = !subscribers.viewModels[viewModel] || !subscribers.aggregateIds[aggregateId];

    const key = getKey(viewModel, aggregateId);
    delete requests[key];

    if (needChange) {
        socket.io.emit('setSubscription', {
            types: getEventTypes(viewModels, subscribers),
            ids: getAggregateIds(viewModels, subscribers)
        });
    }
}

export function createMiddleware(viewModels) {
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
                    subscribe(store, socket, viewModels, subscribers, requests, action).catch(() =>
                        setTimeout(() => store.dispatch(action), REFRESH_TIMEOUT)
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
    typeof window === 'undefined' ? () => () => next => action => next(action) : createMiddleware;

export default middleware;
