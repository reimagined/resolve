export const MERGE = '@@resolve/READ_MODEL_STATE_MERGE';
export const FETCH_MORE = '@@resolve/READ_MODEL_FETCH_MORE';
export const SEND_COMMAND = '@@resolve/SEND_COMMAND';

function merge(readModelName, state) {
    return {
        type: MERGE,
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

function fetchMore(readModelName, query) {
    return {
        type: FETCH_MORE,
        readModelName,
        query
    };
}

export default {
    merge,
    sendCommand,
    fetchMore
};
