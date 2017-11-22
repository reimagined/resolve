import actions, { SUBSCRIBE, UNSUBSCRIBE, SEND_COMMAND, MERGE_STATE } from './actions';
import socketIOClient from 'socket.io-client';

import { getRootableUrl, getKey, checkRequiredFields } from './util';
import fetch from 'isomorphic-fetch';

const CRITICAL_LEVEL = 100;

const sendCommand = async (command) => {
    const response = await fetch(getRootableUrl('/api/commands'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(command)
    });

    if (response.ok) {
        return response.blob();
    }

    const text = await response.text();
    // eslint-disable-next-line no-console
    console.error('Send command error:', text);
    return Promise.reject(text);
};

function createMiddleware(viewModels) {
    const subscribers = {
        viewModels: {},
        aggregateIds: {}
    };

    const requests = {};

    function getEventTypes() {
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

    function getAggregateIds() {
        const aggregateIds = [];

        Object.keys(subscribers.aggregateIds).forEach((aggregateId) => {
            if (!subscribers.aggregateIds[aggregateId]) {
                return;
            }
            aggregateIds.push(aggregateId);
        });

        return aggregateIds;
    }

    return (store) => {
        store.dispatch(actions.provideViewModels(viewModels));

        let socketIOFailCount = 0;
        let socketIO = null;

        const initSocketIO = () => {
            socketIO = socketIOClient(window.location.origin, {
                path: getRootableUrl('/socket/')
            });

            socketIO.on('event', event => store.dispatch(JSON.parse(event)));

            socketIO.on('disconnect', () => {
                socketIOFailCount++;
                if (socketIOFailCount > CRITICAL_LEVEL) {
                    window.location.reload();
                }
                initSocketIO();
            });
        };

        initSocketIO();

        return next => (action) => {
            switch (action.type) {
                case SUBSCRIBE: {
                    const { viewModel, aggregateId } = action;

                    const needChange =
                        !subscribers.viewModels[viewModel] ||
                        !subscribers.aggregateIds[aggregateId];

                    subscribers.viewModels[viewModel] =
                        (subscribers.viewModels[viewModel] || 0) + 1;
                    subscribers.aggregateIds[aggregateId] =
                        (subscribers.aggregateIds[aggregateId] || 0) + 1;

                    if (needChange) {
                        const key = getKey(viewModel, aggregateId);
                        requests[key] = true;

                        fetch(
                            getRootableUrl(`/api/query/${viewModel}?aggregateIds[]=${aggregateId}`),
                            {
                                method: 'GET',
                                credentials: 'same-origin'
                            }
                        )
                            .then((response) => {
                                if (response.ok) {
                                    return response.text();
                                }
                                throw new Error(response.text());
                            })
                            .then((rawState) => {
                                const state = viewModels
                                    .find(({ name }) => name === viewModel)
                                    .deserializeState(rawState);

                                if (requests[key]) {
                                    delete requests[key];

                                    store.dispatch({
                                        type: MERGE_STATE,
                                        aggregateId,
                                        viewModel,
                                        state
                                    });

                                    socketIO.emit('setSubscription', {
                                        types: getEventTypes(),
                                        ids: getAggregateIds()
                                    });
                                }
                            });
                    }

                    break;
                }
                case UNSUBSCRIBE: {
                    const { viewModel, aggregateId } = action;

                    subscribers.viewModels[viewModel] = Math.max(
                        (subscribers.viewModels[viewModel] || 0) - 1,
                        0
                    );
                    subscribers.aggregateIds[aggregateId] = Math.max(
                        (subscribers.aggregateIds[aggregateId] || 0) - 1,
                        0
                    );

                    const needChange =
                        !subscribers.viewModels[viewModel] ||
                        !subscribers.aggregateIds[aggregateId];

                    const key = getKey(viewModel, aggregateId);
                    delete requests[key];

                    if (needChange) {
                        socketIO.emit('setSubscription', {
                            types: getEventTypes(),
                            ids: getAggregateIds()
                        });
                    }

                    break;
                }
                case SEND_COMMAND: {
                    const { command, aggregateId, aggregateName, payload } = action;

                    if (
                        command &&
                        checkRequiredFields(
                            { aggregateId, aggregateName },
                            'Send command error:',
                            JSON.stringify(action)
                        ) &&
                        !command.error
                    ) {
                        const normalizedCommand = {
                            type: command.type,
                            aggregateId,
                            aggregateName,
                            payload
                        };

                        sendCommand(normalizedCommand, store.dispatch).catch((error) => {
                            store.dispatch({
                                ...action,
                                command: {
                                    ...action.command,
                                    error
                                }
                            });
                        });
                    }

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
