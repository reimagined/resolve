import { MERGE, SEND_COMMAND, SUBSCRIBE, UNSUBSCRIBE, PROVIDE_VIEW_MODELS } from './action_types';

function merge(viewModelName, aggregateId, state) {
    return {
        type: MERGE,
        viewModelName,
        aggregateId,
        state
    };
}

function sendCommand({ command, aggregateId, aggregateName, payload }) {
    return {
        type: SEND_COMMAND,
        command,
        aggregateId,
        aggregateName,
        payload
    };
}

function subscribe(viewModelName, aggregateId) {
    return {
        type: SUBSCRIBE,
        viewModelName,
        aggregateId
    };
}

function unsubscribe(viewModelName, aggregateId) {
    return {
        type: UNSUBSCRIBE,
        viewModelName,
        aggregateId
    };
}

function provideViewModels(viewModels) {
    return {
        type: PROVIDE_VIEW_MODELS,
        viewModels
    };
}

export default {
    merge,
    sendCommand,
    subscribe,
    unsubscribe,
    provideViewModels
};
