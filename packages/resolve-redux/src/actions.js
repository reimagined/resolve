export const MERGE_STATE = '@@resolve/READ_MODEL_STATE_MERGE';
export const SEND_COMMAND = '@@resolve/SEND_COMMAND';
export const SET_SUBSCRIPTION = '@@resolve/SET_SUBSCRIPTION';
export const REPLACE_STATE = '@@resolve/REPLACE_STATE';

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

function setSubscription(eventTypes, aggregateIds) {
    return {
        type: SET_SUBSCRIPTION,
        types: eventTypes,
        ids: aggregateIds
    };
}

function replaceState(readModelName, state) {
    return {
        type: REPLACE_STATE,
        readModelName,
        state
    };
}

export default {
    mergeState,
    sendCommand,
    setSubscription,
    replaceState
};
