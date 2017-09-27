import 'regenerator-runtime/runtime';
import fetch from 'isomorphic-fetch';
import { checkRequiredFields, getRootableUrl } from './util';

const sendCommandDefault = async (command) => {
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

export default (params = {}) => store => next => (action) => {
    const { command, aggregateId, aggregateName, payload } = action;

    const sendCommand = params.sendCommand ? params.sendCommand : sendCommandDefault;

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

    return next(action);
};
