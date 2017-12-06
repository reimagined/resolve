import { MERGE, SEND_COMMAND, SUBSCRIBE, UNSUBSCRIBE, PROVIDE_VIEW_MODELS } from './action_types';

function merge(viewModel, aggregateId, state) {
    return {
        type: MERGE,
        viewModel,
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

function subscribe(viewModel, aggregateId) {
    return {
        type: SUBSCRIBE,
        viewModel,
        aggregateId
    };
}

function unsubscribe(viewModel, aggregateId) {
    return {
        type: UNSUBSCRIBE,
        viewModel,
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
