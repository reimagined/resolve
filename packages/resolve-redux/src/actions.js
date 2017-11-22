export const MERGE_STATE = '@@resolve/MERGE_STATE';
export const SEND_COMMAND = '@@resolve/SEND_COMMAND';
export const SUBSCRIBE = '@@resolve/SUBSCRIBE';
export const UNSUBSCRIBE = '@@resolve/UNSUBSCRIBE';
export const PROVIDE_VIEW_MODELS = '@@resolve/PROVIDE_VIEW_MODELS';

function mergeState(readModelName, state) {
    return {
        type: MERGE_STATE,
        readModelName,
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

function subscribe(viewModel, aggregateId = 'root-id') {
    return {
        type: SUBSCRIBE,
        viewModel,
        aggregateId
    };
}

function unsubscribe(viewModel, aggregateId = 'root-id') {
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
    mergeState,
    sendCommand,
    subscribe,
    unsubscribe,
    provideViewModels
};
